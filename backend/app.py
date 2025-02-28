from flask import Flask, request, jsonify, render_template
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import os

# Load the trained XGBoost model
model = xgb.XGBRegressor()
model_path = os.path.join(os.getcwd(), "xgboost_model.json")  # Get full path
model.load_model(model_path)  # Load the saved model

# Create Flask app
app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")  # Render the index.html file

@app.route("/predict_range", methods=["POST"])
def predict_range():
    try:
        # Get JSON data from request
        data = request.get_json()

        # Extract input values from request
        start_date = pd.to_datetime(data["start_date"])
        end_date = pd.to_datetime(data["end_date"])
        material_code = data["Material Code"]
        sales_region = data["Sales Region"]

        # Generate a list of dates within the range
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')

        # Create DataFrame with generated date features
        df = pd.DataFrame({"Billing Date": date_range})
        df["Year"] = df["Billing Date"].dt.year
        df["Month"] = df["Billing Date"].dt.month
        df["Day"] = df["Billing Date"].dt.day
        df["Weekday"] = df["Billing Date"].dt.weekday
        df["Quarter"] = df["Billing Date"].dt.quarter

        # Assign constant values for Material Code and Sales Region
        df["Material Code"] = material_code
        df["Sales Region"] = sales_region

        # Assign default values for missing features
        df["Net Weight"] = 5.2  # Replace with actual default
        df["Invoice Value"] = 3000  # Replace with actual default
        df["Size"] = "L"  # Replace with actual default

        # Drop the Billing Date column
        df.drop(columns=["Billing Date"], inplace=True)

        expected_order = ['Net Weight', 'Sales Region', 'Invoice Value', 'Material Code', 'Size', 'Year', 'Month',
                          'Day', 'Weekday', 'Quarter']
        df = df[expected_order]

        # Encode categorical features
        label_enc = LabelEncoder()
        df["Material Code"] = label_enc.fit_transform(df["Material Code"])
        df["Sales Region"] = label_enc.fit_transform(df["Sales Region"])
        df["Size"] = label_enc.fit_transform(df["Size"])

        # Make predictions for each date
        predictions = model.predict(df)

        # Calculate total predicted sales in the given date range
        total_sales = np.sum(predictions)

        # Return JSON response
        return jsonify({
            "start_date": str(start_date.date()),
            "end_date": str(end_date.date()),
            "predicted_total_sales": float(total_sales)
        })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
