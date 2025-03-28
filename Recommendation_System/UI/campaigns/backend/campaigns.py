from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model, encoder, and scaler
model = joblib.load('campaign_type_model.pkl')
encoder = joblib.load('one_hot_encoder.pkl')
scaler = joblib.load('standard_scaler.pkl')

# Add a root route
@app.route('/')
def home():
    return "Campaign Type Prediction API"

@app.route('/predict', methods=['POST'])
def predict():
    # Get the data from the request
    data = request.get_json()

    # Create a DataFrame from the input data
    input_data = pd.DataFrame([{
        'Duration': int(data['duration']),
        'Ad_Budget': float(data['adBudget']),
        'Reach': float(data['reach']),
        'Clicks': float(data['clicks']),
        'Impressions': float(data['impressions']),
        'Ad_Type': data['adType'],
        'Date': data['date']
    }])

    # Convert 'Date' to datetime and extract useful features
    input_data['Date'] = pd.to_datetime(input_data['Date'])
    input_data['Year'] = input_data['Date'].dt.year
    input_data['Month'] = input_data['Date'].dt.month
    input_data['Day'] = input_data['Date'].dt.day
    input_data = input_data.drop('Date', axis=1)

    # Ensure all possible Ad_Type categories are present in the input data
    all_ad_types = encoder.get_feature_names_out(['Ad_Type'])
    for ad_type in all_ad_types:
        if ad_type not in input_data.columns:
            input_data[ad_type] = 0  # Add missing columns with default value 0

    # Encode categorical variables
    encoded_cats = encoder.transform(input_data[['Ad_Type']])
    encoded_cat_columns = encoder.get_feature_names_out(['Ad_Type'])
    input_data = input_data.drop('Ad_Type', axis=1)
    input_data[encoded_cat_columns] = encoded_cats

    # Scale numeric features
    numeric_features = input_data.select_dtypes(include=['float64', 'int64']).columns
    input_data[numeric_features] = scaler.transform(input_data[numeric_features])

    # Ensure the columns are in the same order as during training
    input_data = input_data[model.feature_names_in_]

    # Make prediction
    prediction = model.predict(input_data)
    campaign_type = {0: 'Mega', 1: 'General', 2: 'Social Media', 3: 'Influencer'}[prediction[0]]

    # Return the prediction
    return jsonify({'prediction': campaign_type})

if __name__ == '__main__':
    app.run(debug=True)