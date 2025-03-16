from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report, confusion_matrix

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Define file paths
DATA_FILE = "Defects_ladder.xlsx"  # Simplified relative path
MODEL_FILE = "random_forest_model.pkl"  # Simplified relative path


def load_and_preprocess_data():
    """Load and preprocess dataset."""
    try:
        # Load data using a simple file path
        df = pd.read_excel(DATA_FILE)
        print("Columns found in file:", df.columns)  # Debugging columns
        df = df.dropna().drop(columns=['Date', 'Product ID'])  # Clean data
        X = df[['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting']]
        y = df['Defect']
        return X, y
    except FileNotFoundError:
        raise FileNotFoundError(
            f"The data file '{DATA_FILE}' was not found. Please ensure it exists in the current directory.")


def train_and_save_model():
    """Train and save the RandomForest model."""
    X, y = load_and_preprocess_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)

    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=2,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=0,
        class_weight='balanced'
    )
    rf_model.fit(X_train, y_train)

    # Save model
    joblib.dump(rf_model, MODEL_FILE)
    print(f"Model saved at {MODEL_FILE}")

    # Print model evaluation
    evaluate_model(rf_model, X_train, y_train, X_test, y_test)

    return rf_model, y_train


def evaluate_model(model, X_train, y_train, X_test, y_test):
    """Evaluate and print model metrics, including train and test accuracy."""
    # Predict training and test datasets
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)

    # Compute train and test accuracy
    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)

    # Print train and test accuracy
    print("\n🔍 Model Performance:")
    print(f"✅ Train Accuracy: {train_accuracy:.4f}")
    print(f"✅ Test Accuracy: {test_accuracy:.4f}")

    # Compute ROC-AUC and classification report for the test dataset
    y_test_pred_proba = model.predict_proba(X_test)[:, 1]
    print(f"📊 Test ROC-AUC: {roc_auc_score(y_test, y_test_pred_proba):.4f}")
    print("📃 Classification Report (Test dataset):\n", classification_report(y_test, y_test_pred))

    # Generate and print confusion matrix for the test dataset
    cm = confusion_matrix(y_test, y_test_pred)
    print("\n🌀 Confusion Matrix (Test):")
    print(cm)

    # Graphical representation of confusion matrix
    plt.figure(figsize=(10, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=['Negative', 'Positive'],
                yticklabels=['Negative', 'Positive'])
    plt.xlabel("Predicted labels")
    plt.ylabel("True labels")
    plt.title("Confusion Matrix (Test)")
    plt.show()


def validate_features(data):
    """Validate input features required for ladder."""
    expected_features = ['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting']
    for feature in expected_features:
        if feature not in data:
            raise ValueError(f"Missing required feature: {feature}")


# Train the model at startup
print("⚙️ Training the model...")
try:
    model, y_train = train_and_save_model()
except FileNotFoundError as fnfe:
    print(f"Error during startup: {fnfe}")
    model, y_train = None, None


@app.route('/')
def home():
    """Health check endpoint."""
    return jsonify({"message": "Ladder Defect Prediction API is running!"})


@app.route('/defectPredict', methods=['POST'])
def predict():
    """Endpoint for defect ladder."""
    try:
        data = request.get_json()
        print("Incoming request data:", data)  # Debugging

        # Validate input features
        validate_features(data)

        df_input = pd.DataFrame([data], columns=['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting'])

        # Make ladder
        prediction = model.predict(df_input)[0]
        probability = model.predict_proba(df_input)[:, 1][0]

        return jsonify({"ladder": int(prediction), "probability": round(probability, 2)})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Error during ladder: {e}")  # Debugging
        return jsonify({"error": str(e)}), 500


@app.route('/estimate_production', methods=['POST'])
def estimate_production():
    """Endpoint for estimating production target."""
    try:
        data = request.get_json()
        print("Incoming request data for production:", data)  # Debugging

        # Validate input
        target_count = int(data['target_count'])

        # Calculate defect rate from training data
        if y_train is None:
            raise ValueError("Model training failed. Data might be missing.")
        defect_rate = sum(y_train) / len(y_train)
        estimated_production = int(target_count / (1 - defect_rate))

        return jsonify({"estimated_production": estimated_production, "defect_rate": round(defect_rate, 2)})
    except KeyError:
        return jsonify({"error": "Missing required field: target_count"}), 400
    except Exception as e:
        print(f"Error during production estimation: {e}")  # Debugging
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
