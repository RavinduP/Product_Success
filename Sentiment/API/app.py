from flask import Flask, jsonify, request
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import pandas as pd
import os
import pymongo
from pymongo import MongoClient


# ✅ Load BERT model and tokenizer (Directly from Hugging Face)
MODEL_NAME = "nlptown/bert-base-multilingual-uncased-sentiment"  # Change if needed
tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
model = BertForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()  # Set model to evaluation mode


app = Flask(__name__)
CORS(app)  # Allow frontend access

# ✅ Connect to MongoDB
MONGO_URI = "mongodb://localhost:27017"  # Your MongoDB URI here
client = MongoClient(MONGO_URI)
db = client['Sentiment_DB']  # Replace with your actual database name
collection = db['dataset']  # Replace with your actual collection name

# ✅ Load dataset
DATA_PATH = "../backend/data/reviews.csv"  # Update with actual file path
if os.path.exists(DATA_PATH):
    df = pd.read_csv(DATA_PATH)
else:
    df = pd.DataFrame(columns=["product_type", "size", "text", "rating", "sentiment"])  # Empty fallback

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Flask API!"})

@app.route('/getAllData', methods=['GET'])
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

    # Map predictions back to sentiment labels
    sentiment_map = {0: "Very Negative", 1: "Negative", 2: "Neutral", 3: "Positive", 4: "Very Positive"}
    return sentiment_map[preds]

# API Endpoint to receive text and return sentiment
@app.route('/predict', methods=['POST'])
def predict():
    # Get input text from request
    data = request.get_json()
    text = data.get('text')

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Get prediction
    sentiment = predict_sentiment(text)

    return jsonify({"sentiment": sentiment})

# API Endpoint for CSV Sentiment Analysis
@app.route('/predict_csv', methods=['POST'])
def predict_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Read CSV
    df = pd.read_csv(file)
    if 'text' not in df.columns:
        return jsonify({"error": "CSV must contain a 'text' column"}), 400

    # Predict sentiment for each row
    sentiment_counts = {"Very Negative": 0, "Negative": 0, "Neutral": 0, "Positive": 0, "Very Positive": 0}
    df['sentiment'] = df['text'].apply(predict_sentiment)

    # Count sentiment distribution
    for sentiment in df['sentiment']:
        sentiment_counts[sentiment] += 1

    return jsonify(sentiment_counts)


# ✅ Run Flask App
if __name__ == '__main__':
    app.run(debug=True)
