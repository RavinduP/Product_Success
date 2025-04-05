# Modified app.py
from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

# Check if model files exist
model_path = os.path.join('model', 'campaign_type_model.pkl')
encoder_path = os.path.join('model', 'one_hot_encoder.pkl')
scaler_path = os.path.join('model', 'standard_scaler.pkl')

# Create model directory if it doesn't exist
os.makedirs('model', exist_ok=True)

# Add status messages to help with debugging
if not os.path.exists(model_path):
    print(f"Warning: Model file {model_path} does not exist!")
if not os.path.exists(encoder_path):
    print(f"Warning: Encoder file {encoder_path} does not exist!")
if not os.path.exists(scaler_path):
    print(f"Warning: Scaler file {scaler_path} does not exist!")

try:
    model = joblib.load(model_path)
    encoder = joblib.load(encoder_path)
    scaler = joblib.load(scaler_path)
    models_loaded = True
    print("All models loaded successfully")
except Exception as e:
    models_loaded = False
    print(f"Error loading models: {e}")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/status')
def status():
    return jsonify({
        "status": "running", 
        "models_loaded": models_loaded,
        "message": "Model is active!" if models_loaded else "Models failed to load"
    })

@app.route('/predict', methods=['POST'])
def predict():
    if not models_loaded:
        return jsonify({'error': 'Models are not loaded'}), 500
        
    try:
        # Get the data from the request
        data = request.get_json()
        
        # Fix the date format (convert YYYY-MM to YYYY-MM-DD)
        date_str = data['date']
        if len(date_str) <= 7:  # If only YYYY-MM is provided
            date_str = f"{date_str}-01"  # Add day as the 1st
            
        # Create a DataFrame from the input data
        input_data = pd.DataFrame([{
            'Duration': int(data['duration']),
            'Ad_Budget': float(data['adBudget']),
            'Reach': float(data['reach']),
            'Clicks': float(data['clicks']),
            'Impressions': float(data['impressions']),
            'Ad_Type': data['adType'],
            'Date': date_str
        }])

        # Convert 'Date' to datetime and extract useful features
        input_data['Date'] = pd.to_datetime(input_data['Date'])
        input_data['Year'] = input_data['Date'].dt.year
        input_data['Month'] = input_data['Date'].dt.month
        input_data['Day'] = input_data['Date'].dt.day
        input_data = input_data.drop('Date', axis=1)
        
        # Encode categorical variables
        encoded_cats = encoder.transform(input_data[['Ad_Type']])
        encoded_cat_columns = encoder.get_feature_names_out(['Ad_Type'])
        input_data = input_data.drop('Ad_Type', axis=1)
        input_data[encoded_cat_columns] = encoded_cats
        
        # Scale numeric features
        numeric_features = input_data.select_dtypes(include=['float64', 'int64']).columns
        input_data[numeric_features] = scaler.transform(input_data[numeric_features])
        
        # Check for missing columns and add them with zeros
        for col in model.feature_names_in_:
            if col not in input_data.columns:
                input_data[col] = 0
                
        # Reorder columns to match model expectations
        input_data = input_data[model.feature_names_in_]

        # Make prediction
        prediction = model.predict(input_data)
        prediction_proba = model.predict_proba(input_data)[0]
        campaign_type = {0: 'Mega', 1: 'General', 2: 'Social Media', 3: 'Influencer'}[prediction[0]]
        
        # Get confidence score (probability of the predicted class)
        confidence = float(prediction_proba[prediction[0]])

        # Return the prediction with confidence
        return jsonify({
            'prediction': campaign_type,
            'confidence': round(confidence * 100, 2),
            'probabilities': {
                'Mega': round(float(prediction_proba[0]) * 100, 2),
                'General': round(float(prediction_proba[1]) * 100, 2),
                'Social Media': round(float(prediction_proba[2]) * 100, 2),
                'Influencer': round(float(prediction_proba[3]) * 100, 2)
            }
        })
        
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)