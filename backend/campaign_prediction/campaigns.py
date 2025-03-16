from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app)

# Load pre-trained model, encoder, and scaler
model = joblib.load('campaign_type_model.pkl')
encoder = joblib.load('one_hot_encoder.pkl')
scaler = joblib.load('standard_scaler.pkl')


@app.route('/')
def home():
    return 'Campaign Type Prediction API'


@app.route('/campaignPredict', methods=['POST'])
def predict():
    try:
        # Validate incoming JSON
        data = request.get_json()
        if not all(k in data for k in ['duration', 'adBudget', 'reach', 'clicks', 'impressions', 'adType', 'date']):
            return jsonify({'error': 'Missing required fields'}), 400

        # Prepare input DataFrame
        input_data = pd.DataFrame([{
            'Duration': int(data['duration']),
            'Ad_Budget': float(data['adBudget']),
            'Reach': float(data['reach']),
            'Clicks': float(data['clicks']),
            'Impressions': float(data['impressions']),
            'Ad_Type': data['adType'],
            'Date': data['date']
        }])

        # Date feature extraction
        input_data['Date'] = pd.to_datetime(input_data['Date'])
        input_data['Year'] = input_data['Date'].dt.year
        input_data['Month'] = input_data['Date'].dt.month
        input_data['Day'] = input_data['Date'].dt.day
        input_data = input_data.drop('Date', axis=1)

        # Validate Ad_Type
        if data['adType'] not in encoder.categories_[0]:
            return jsonify(
                {'error': f"Invalid Ad_Type: {data['adType']}. Expected one of {list(encoder.categories_[0])}"}), 400

        # Encode categorical variables
        encoded_cats = encoder.transform(input_data[['Ad_Type']])
        encoded_cat_columns = encoder.get_feature_names_out(['Ad_Type'])
        input_data = input_data.drop('Ad_Type', axis=1)
        input_data[encoded_cat_columns] = encoded_cats

        # Scale numeric features
        numeric_features = input_data.select_dtypes(include=['float64', 'int64']).columns
        input_data[numeric_features] = scaler.transform(input_data[numeric_features])

        # Ensure correct feature order
        input_data = input_data[model.feature_names_in_]

        # Make ladder
        prediction = model.predict(input_data)
        campaign_type = {0: 'Mega', 1: 'General', 2: 'Social Media', 3: 'Influencer'}[prediction[0]]

        return jsonify({'ladder': campaign_type})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)
