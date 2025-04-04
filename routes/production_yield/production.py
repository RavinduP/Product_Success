import os
import pandas as pd
import joblib
from flask import Blueprint, request, jsonify

# Create Blueprint for API routes
# api = Blueprint('api', __name__)

# =====================
# MODEL CONFIGURATION
# =====================
# MODEL_PATH = "../"
# DATA_PATH = "data/Defects_ladder.xlsx"

production_bp = Blueprint('production_yield', __name__)

current_dir = os.path.dirname(os.path.abspath(__file__))
model_weights_path = os.path.abspath(os.path.join(current_dir, '../../models/production_yield/defects_model.pkl'))
EXCEL_PATH = os.path.abspath(os.path.join(current_dir, '../../data/market_demand/Defects_ladder.xlsx'))

# Initialize model
# defects_model = DefectsModel(data_path=EXCEL_PATH, model_path=model_weights_path)

# Load the model
try:
    defects_model = joblib.load(model_weights_path)
except Exception as e:
    print(f"Failed to load model: {str(e)}")
    defects_model = None

@production_bp.route('/predict', methods=['POST', 'OPTIONS'])
def predict_defects():
    """API endpoint to predict defects"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.json
        required_fields = ['cutting', 'punching', 'inboxing', 'hinging', 'riveting']

        # Validate inputs (must be 0 or 1)
        for field in required_fields:
            value = data.get(field)
            if value not in (0, 1):
                return jsonify({'error': f'Invalid value for {field}. Must be 0 or 1'}), 400

        # Format DataFrame
        features = pd.DataFrame([[
            data['cutting'],
            data['punching'],
            data['inboxing'],
            data['hinging'],
            data['riveting']
        ]], columns=['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting'])

        if defects_model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        prediction = defects_model.predict(features)
        return jsonify({'prediction': int(prediction[0])})
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500