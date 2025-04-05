from flask import Flask, render_template, request, jsonify, Blueprint
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import os


campaign_bp = Blueprint('campaign', __name__)

current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the model, encoder, and scaler
model_path = os.path.join(current_dir, '../../models/marketing_campaign/campaign_type_model.pkl')
encoder_path = os.path.join(current_dir, '../../models/marketing_campaign/one_hot_encoder.pkl')
scaler_path = os.path.join(current_dir, '../../models/marketing_campaign/standard_scaler.pkl')

model = joblib.load(model_path)
encoder = joblib.load(encoder_path)
scaler = joblib.load(scaler_path)

print("\n=== Campaign Predictor ===")
print(f"Model exists: {os.path.exists(model_path)}")

@campaign_bp.route('/')
def campaign_page():
    return render_template('campaign.html')  # Render the HTML form

@campaign_bp.route('/status')
def status():
    return jsonify({"status": "running", "message": "Model is active!"})

@campaign_bp.route('/predict', methods=['POST'])
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
    # Get the list of all possible Ad_Type categories from the encoder
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
    prediction_proba = model.predict_proba(input_data)[0]
    campaign_type = {0: 'Mega', 1: 'General', 2: 'Social Media', 3: 'Influencer'}[prediction[0]]

    # Return the prediction with probabilities
    return jsonify({
        'prediction': campaign_type,
        'confidence': round(float(prediction_proba[prediction[0]]) * 100, 2),
        'probabilities': {
            'Mega': round(float(prediction_proba[0]) * 100, 2),
            'General': round(float(prediction_proba[1]) * 100, 2),
            'Social Media': round(float(prediction_proba[2]) * 100, 2),
            'Influencer': round(float(prediction_proba[3]) * 100, 2)
        }
    })

