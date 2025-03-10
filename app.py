from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Define file paths
DATA_FILE = os.path.join(os.getcwd(), "/Users/ikraamimtiaz/Downloads/coreui-free-react-admin-template-main/Defects_ladder.xlsx")
MODEL_FILE = os.path.join(os.getcwd(), "model/random_forest_model.pkl")


def load_and_preprocess_data():
    """Load and preprocess dataset."""
    df = pd.read_excel(DATA_FILE)
    df = df.dropna().drop(columns=['Date', 'Product ID'])  # Clean data
    X = df[['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting']]
    y = df['Defect']
    return X, y


def train_and_save_model():
    """Train and save the RandomForest model."""
    X, y = load_and_preprocess_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)

    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=3,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=0,
        class_weight='balanced'
    )
    rf_model.fit(X_train, y_train)

    # Save model
    os.makedirs("model", exist_ok=True)  # Ensure directory exists
    joblib.dump(rf_model, MODEL_FILE)

    # Print model evaluation
    evaluate_model(rf_model, X_test, y_test)

    return rf_model, y_train


def evaluate_model(model, X_test, y_test):
    """Evaluate and print model accuracy and metrics."""
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    print("\n🔍 Model Performance:")
    print(f"✅ Test Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"📊 Test ROC-AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
    print("📃 Classification Report:\n", classification_report(y_test, y_pred))


# Load model & training data
if not os.path.exists(MODEL_FILE):
    print("⚠️ Model not found, training a new one...")
    model, y_train = train_and_save_model()
else:
    print("✅ Loading existing model...")
    model = joblib.load(MODEL_FILE)
    X, y = load_and_preprocess_data()  # Load dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)
    evaluate_model(model, X_test, y_test)  # Print accuracy after loading

@app.route('/')
def home():
    return jsonify({"message": "Ladder Defect Prediction API is running!"})


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        # Ensure correct feature names
        df_input = pd.DataFrame([data], columns=['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting'])

        # Make prediction
        prediction = model.predict(df_input)[0]
        probability = model.predict_proba(df_input)[:, 1][0]

        return jsonify({"prediction": int(prediction), "probability": round(probability, 2)})
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route('/estimate_production', methods=['POST'])
def estimate_production():
    try:
        data = request.get_json()
        target_count = int(data['target_count'])

        # Calculate defect rate from training data
        defect_rate = sum(y_train) / len(y_train)
        estimated_production = int(target_count / (1 - defect_rate))

        return jsonify({"estimated_production": estimated_production, "defect_rate": round(defect_rate, 2)})
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
