from flask import Flask, request, jsonify, render_template
import pandas as pd
import joblib
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load the saved model pipeline
MODEL_PATH = "ladder_sales_prediction_pipeline.joblib"
try:
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load sample data for forecasting (you'll need this to create feature columns)
try:
    data = pd.ExcelFile("Ladders updated data.xlsx")
    df = data.parse('Data')

    # Apply the same preprocessing as in your original code
    # (simplified version just to have the necessary columns)
    df['Date'] = df['Billing Date']
    df = df.sort_values(by='Date')

    # Basic preprocessing to match your model's expected format
    # Add date features
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df['Weekday'] = df['Date'].dt.weekday
    df['Quarter'] = df['Date'].dt.quarter
    df['DayOfYear'] = df['Date'].dt.dayofyear
    df['WeekOfYear'] = df['Date'].dt.isocalendar().week
    df['IsWeekend'] = df['Weekday'].apply(lambda x: 1 if x >= 5 else 0)
    df['IsMonthStart'] = df['Date'].dt.is_month_start.astype(int)
    df['IsMonthEnd'] = df['Date'].dt.is_month_end.astype(int)
    df['IsQuarterStart'] = df['Date'].dt.is_quarter_start.astype(int)
    df['IsQuarterEnd'] = df['Date'].dt.is_quarter_end.astype(int)

    # Map region codes to region names (same as in original code)
    region_mapping = {
        "R1": "North", "R2": "Kandy", "R3": "Kurunagela", "R4": "Southern", "R5": "Negombo",
        "R6": "East", "R7": "Colombo", "R8": "Key Accounts", "PR": "Projects", "PR-EX": "Projects Export",
        "EX": "Exports", "DR": "Direct"
    }
    df["Sales Region"] = df["Sales Region"].replace(region_mapping)

    # Get available regions and sizes for dropdown menus
    available_regions = sorted(df["Sales Region"].unique())
    available_sizes = sorted(df["Size"].unique())

    print(f"Data loaded successfully. Found {len(available_regions)} regions and {len(available_sizes)} sizes.")
except Exception as e:
    print(f"Error loading data: {e}")
    df = None
    available_regions = ["North", "Kandy", "Kurunagela", "Southern", "Negombo", "East", "Colombo"]
    available_sizes = ["STEP LADDER", "EXTENSION LADDER", "MULTIPURPOSE LADDER"]


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html',
                           regions=available_regions,
                           sizes=available_sizes)


@app.route('/predict', methods=['POST'])
def predict():
    """Generate predictions based on form input"""
    try:
        # Get form data
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        size = request.form.get('size')
        region = request.form.get('region')
        granularity = request.form.get('granularity', 'monthly')

        # Validate inputs
        if not all([start_date, end_date, size, region]):
            return jsonify({
                'error': 'Missing required parameters',
                'status': 'error'
            })

        # Check if model is loaded
        if model is None or df is None:
            return jsonify({
                'error': 'Model or dataset not loaded properly. Check server logs.',
                'status': 'error'
            })

        # Convert dates to datetime
        start_date_dt = pd.to_datetime(start_date)
        end_date_dt = pd.to_datetime(end_date)

        # Generate forecast (simplified from your original code)
        forecast_df = generate_sales_forecast(
            model=model,
            df=df,
            forecast_start_date=start_date,
            forecast_end_date=end_date,
            size=size,
            region=region,
            granularity=granularity
        )

        # Format result for JSON response
        result = {
            'dates': forecast_df.index.strftime('%Y-%m-%d').tolist(),
            'predictions': forecast_df['predicted_sales'].tolist(),
            'total': float(forecast_df['predicted_sales'].sum()),
            'average': float(forecast_df['predicted_sales'].mean()),
            'max': float(forecast_df['predicted_sales'].max()),
            'min': float(forecast_df['predicted_sales'].min()),
            'status': 'success'
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        })


def generate_sales_forecast(model, df, forecast_start_date, forecast_end_date, size, region, granularity='monthly'):
    """
    Generate a time series forecast for ladder sales (simplified version)
    """
    # Convert dates to datetime
    start_date = pd.to_datetime(forecast_start_date)
    end_date = pd.to_datetime(forecast_end_date)

    # Create date range for forecast based on granularity
    if granularity == 'daily':
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    elif granularity == 'weekly':
        date_range = pd.date_range(start=start_date, end=end_date, freq='W')
    else:  # Default to monthly
        date_range = pd.date_range(start=start_date, end=end_date, freq='MS')

    # Create empty forecast dataframe
    forecast_df = pd.DataFrame(index=date_range)
    forecast_df.index.name = 'Date'
    forecast_df['predicted_sales'] = 0

    # Create the relevant column names based on one-hot encoding
    size_col = f"Size_{size}"
    region_col = f"Sales Region_{region}"

    # Process each date in the range
    for date in date_range:
        # Create a sample data point with the necessary features
        sample = df.iloc[0:1].copy()

        # Set categorical columns to 0 first
        for col in sample.columns:
            if col.startswith('Size_') or col.startswith('Sales Region_'):
                sample[col] = 0

        # Create one-hot encoded columns if they don't exist
        if size_col not in sample.columns:
            sample[size_col] = 0
        if region_col not in sample.columns:
            sample[region_col] = 0

        # Set the selected size and region
        sample[size_col] = 1
        sample[region_col] = 1

        # Set date features
        sample['Date'] = date
        sample['Year'] = date.year
        sample['Month'] = date.month
        sample['Day'] = date.day
        sample['Weekday'] = date.weekday()
        sample['Quarter'] = date.quarter
        sample['DayOfYear'] = date.dayofyear
        sample['WeekOfYear'] = date.isocalendar()[1]
        sample['IsWeekend'] = 1 if date.weekday() >= 5 else 0
        sample['IsMonthStart'] = 1 if date.is_month_start else 0
        sample['IsMonthEnd'] = 1 if date.is_month_end else 0
        sample['IsQuarterStart'] = 1 if date.is_quarter_start else 0
        sample['IsQuarterEnd'] = 1 if date.is_quarter_end else 0

        # Set seasonal features
        sample['season'] = 1 if sample['Month'].iloc[0] in [12, 1, 2] else \
            2 if sample['Month'].iloc[0] in [3, 4, 5] else \
                3 if sample['Month'].iloc[0] in [6, 7, 8] else 4

        # Create interaction features
        sample['weekday_season'] = sample['Weekday'] * sample['season']
        sample['month_size_interaction'] = sample['Month'] * sample[size_col]

        # For time-series features (lags, rolling stats), use median values
        for col in df.columns:
            if ('lag' in col or 'rolling' in col or 'expanding' in col) and col in sample.columns:
                sample[col] = df[col].median()

        # Make prediction (exclude target and date columns)
        X_pred = sample.drop(columns=['QTY(EA)', 'Date'], errors='ignore')

        # Fill any missing columns expected by the model with median values
        if hasattr(model, 'feature_names_in_'):
            for col in model.feature_names_in_:
                if col not in X_pred.columns:
                    X_pred[col] = df[col].median() if col in df.columns else 0

            # Keep only columns expected by model
            X_pred = X_pred[model.feature_names_in_]

        # Make prediction
        try:
            prediction = model.predict(X_pred)[0]
            # Ensure non-negative prediction
            prediction = max(0, prediction)
        except Exception as e:
            print(f"Prediction error: {e}")
            prediction = 0

        # Store prediction
        forecast_df.loc[date, 'predicted_sales'] = prediction

    # Aggregate if necessary (though date range already accounts for granularity)
    if granularity == 'weekly':
        forecast_df = forecast_df.resample('W').sum()
    elif granularity == 'monthly':
        forecast_df = forecast_df.resample('MS').sum()

    return forecast_df


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=True, host='127.0.0.1', port=8080)