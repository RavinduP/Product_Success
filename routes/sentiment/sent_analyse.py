from flask import Blueprint, jsonify, request
from flask_cors import CORS
import torch
import pandas as pd
import os
import pymongo
from pymongo import MongoClient
from transformers import AutoTokenizer, AutoModelForSequenceClassification


sentiment_bp = Blueprint('sentiment', __name__)
CORS(sentiment_bp) 

MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

current_dir = os.path.dirname(os.path.abspath(__file__))
model_weights_path = os.path.join(current_dir, '../../models/sentiment')  

print("\n=== Sentiment Predictor ===")
print(f"Model exists: {os.path.exists(model_weights_path)}")

# ✅ Connect to MongoDB
MONGO_URI = "mongodb://localhost:27017"  
client = MongoClient(MONGO_URI)
db = client['Sentiment_DB']  
collection = db['dataset']  

# ✅ Load dataset
DATA_PATH = os.path.join(current_dir,"../../data/sentiment/review_dataset.csv" ) 
if os.path.exists(DATA_PATH):
    df = pd.read_csv(DATA_PATH)
else:
    df = pd.DataFrame(columns=["Id", "date", "product_type", "size", "Sentiment","Review"])
@sentiment_bp.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Flask API!"})

@sentiment_bp.route('/getAllData', methods=['GET'])
def get_all_data():
    # Fetch all documents from the MongoDB collection
    data = collection.find({}, {"_id": 0})  # Exclude the _id field
    data_list = list(data)  # Convert cursor to list

    if len(data_list) == 0:
        return jsonify({"error": "No data found"}), 404
    
    return jsonify(data_list)

# Sentiment Prediction Function
def predict_sentiment(text):
    # Tokenize input text
    inputs = tokenizer(text, padding='max_length', truncation=True, max_length=512, return_tensors="pt")

    # Move tensors to GPU if available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    inputs = {key: value.to(device) for key, value in inputs.items()}
    model.to(device)

    # Inference
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        preds = torch.argmax(logits, dim=-1).item()

    # sentiment mapping 
    sentiment_map = {0: "Negative", 1: "Neutral", 2: "Positive"}
    return sentiment_map[preds]

# # API Endpoint to receive text and return sentiment
# @sentiment_bp.route('/predict', methods=['POST'])
# def predict():
#     # Get input text from request
#     data = request.get_json()
#     text = data.get('text')

#     if not text:
#         return jsonify({"error": "No text provided"}), 400

#     # Get prediction
#     sentiment = predict_sentiment(text)

#     return jsonify({"sentiment": sentiment})

# API Endpoint for CSV Sentiment Analysis
@sentiment_bp.route('/predict_csv', methods=['POST'])
def predict_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read CSV
        df = pd.read_csv(file)
        if 'text' not in df.columns:
            return jsonify({"error": "CSV must contain a 'text' column"}), 400

        # Predict sentiment for each row
        sentiment_counts = {
            "Negative": 0,
            "Neutral": 0, 
            "Positive": 0
        }
        samples = []
        
        for index, row in df.iterrows():
            text = row['text']
            sentiment = predict_sentiment(text)
            sentiment_counts[sentiment] += 1
            
            # Store first 3 samples for verification
            if index < 3:
                samples.append({"text": text, "sentiment": sentiment})

        return jsonify({
            "sentiment_counts": sentiment_counts,
            "samples": samples,
            "total": len(df)
        })

    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500