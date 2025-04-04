from flask import Blueprint, jsonify, request, render_template
import pandas as pd
import joblib
import os
import sys
from datetime import datetime

market_bp = Blueprint('market_demand', __name__)

current_dir = os.path.dirname(os.path.abspath(__file__))
model_weights_path = os.path.abspath(os.path.join(current_dir, '../../models/market_demand/ladder_ensemble.joblib'))
EXCEL_PATH = os.path.abspath(os.path.join(current_dir, '../../data/market_demand/Ladders_data.xlsx'))

print("\n=== Initializing Market Demand Predictor ===")
print(f"Model path: {model_weights_path}")
print(f"Excel path: {EXCEL_PATH}")
print(f"Model exists: {os.path.exists(model_weights_path)}")
print(f"Excel exists: {os.path.exists(EXCEL_PATH)}\n")


try:
    if not os.path.exists(model_weights_path):
        raise FileNotFoundError(f"Model file not found at {model_weights_path}")
    
    model = joblib.load(model_weights_path)
    print("✓ Model loaded successfully")
    print(f"Model type: {type(model)}")
    
    # Verify model has required methods
    if not hasattr(model, 'predict'):
        raise AttributeError("Model missing required 'predict' method")
        
except Exception as e:
    print(f"✗ Model loading failed: {str(e)}")
    model = None
    # sys.exit(1)  # Uncomment to fail fast if model is critical

try:
    if not os.path.exists(EXCEL_PATH):
        raise FileNotFoundError(f"Excel file not found at {EXCEL_PATH}")
    
    # Try multiple Excel engines for compatibility
    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name='Data', engine='openpyxl')
    except Exception as e:
        print(f"Openpyxl failed, trying xlrd: {str(e)}")
        df = pd.read_excel(EXCEL_PATH, sheet_name='Data', engine='xlrd')
    
    print("\n✓ Excel data loaded successfully")
    print(f"Data shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    
    
    # Date handling
    df['Date'] = pd.to_datetime(df['Billing Date'], errors='coerce')
    if df['Date'].isnull().any():
        bad_dates = df[df['Date'].isnull()]['Billing Date'].unique()
        print(f"Warning: Could not parse these dates: {bad_dates}")
        df = df.dropna(subset=['Date'])
    
    df = df.sort_values('Date')

    print("\n=== Initializing Market Demand Predictor ===")
    print(f"Model path: {model_weights_path}")
    print(f"Excel path: {EXCEL_PATH}")
    print(f"Model exists: {os.path.exists(model_weights_path)}")
    print(f"Excel exists: {os.path.exists(EXCEL_PATH)}\n")
    
    # Date features
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
    
    # Region mapping
    region_mapping = {
        "R1": "North", "R2": "Kandy", "R3": "Kurunagela", 
        "R4": "Southern", "R5": "Negombo", "R6": "East", 
        "R7": "Colombo", "R8": "Key Accounts", "PR": "Projects", 
        "PR-EX": "Projects Export", "EX": "Exports", "DR": "Direct"
    }
    df["Sales Region"] = df["Sales Region"].replace(region_mapping)
    
    # Available options
    available_regions = sorted(df["Sales Region"].unique())
    available_sizes = sorted(df["Size"].unique())
    
    print(f"\nAvailable regions: {available_regions}")
    print(f"Available sizes: {available_sizes}")
    
except Exception as e:
    print(f"✗ Data loading failed: {str(e)}")
    df = None
    available_regions = ["North", "Kandy", "Kurunagela", "Southern", "Negombo", "East", "Colombo"]
    available_sizes = ["STEP LADDER", "EXTENSION LADDER", "MULTIPURPOSE LADDER"]


@market_bp.route('/')
def market_page():
    """Render the market prediction page"""
    if model is None or df is None:
        return render_template('error.html', 
                            message="Service unavailable - model or data not loaded"), 503
    return render_template('market.html',
                         regions=available_regions,
                         sizes=available_sizes)

@market_bp.route('/predict', methods=['POST'])
def predict():
    print("Predict endpoint hit!") 
    """Handle prediction requests"""
    print("\n=== New Prediction Request ===")
    print(f"Model status: {'LOADED' if model else 'MISSING'}")
    print(f"Data status: {'LOADED' if df is not None else 'MISSING'}")
    
    try:
        # Validate service availability
        if model is None or df is None:
            raise RuntimeError("Model or data not loaded - check server logs")
        
        # Get form data
        form_data = request.form
        print(f"Form data: {dict(form_data)}")
        
        start_date = form_data.get('start_date')
        end_date = form_data.get('end_date')
        size = form_data.get('size')
        region = form_data.get('region')
        granularity = form_data.get('granularity', 'monthly')
        
        # Validate inputs
        if not all([start_date, end_date, size, region]):
            raise ValueError("Missing required parameters")
        
        # Generate forecast
        forecast_df = generate_sales_forecast(
            model=model,
            df=df,
            forecast_start_date=start_date,
            forecast_end_date=end_date,
            size=size,
            region=region,
            granularity=granularity
        )
        
        # Prepare response
        result = {
            'dates': forecast_df.index.strftime('%Y-%m-%d').tolist(),
            'predictions': forecast_df['predicted_sales'].tolist(),
            'total': float(forecast_df['predicted_sales'].sum()),
            'average': float(forecast_df['predicted_sales'].mean()),
            'max': float(forecast_df['predicted_sales'].max()),
            'min': float(forecast_df['predicted_sales'].min()),
            'status': 'success'
        }
        
        print("✓ Prediction successful")
        return jsonify(result)
        
    except Exception as e:
        error_msg = str(e)
        print(f"✗ Prediction failed: {error_msg}")
        return jsonify({
            'error': error_msg,
            'status': 'error'
        }), 400
    
@market_bp.route('/test-data')
def test_data():
    return jsonify({
        'regions': available_regions,
        'sizes': available_sizes
    })  


def generate_sales_forecast(model, df, forecast_start_date, forecast_end_date, 
                          size, region, granularity='monthly'):
    """Generate sales forecast for given parameters"""
    try:
        start_date = pd.to_datetime(forecast_start_date)
        end_date = pd.to_datetime(forecast_end_date)
        
        # Create date range - always use daily and aggregate later
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        forecast_df = pd.DataFrame(index=date_range)
        forecast_df.index.name = 'Date'
        
        # Get median values for all features
        median_values = df.median(numeric_only=True)
        mode_values = df.mode().iloc[0]
        
        # Prepare a clean sample row
        sample = pd.DataFrame(index=[0])
        for col in df.columns:
            if col not in ['QTY(EA)', 'Date', 'Billing Date']:
                if col.startswith(('Size_', 'Sales Region_')):
                    sample[col] = 0  # Initialize all categoricals to 0
                elif df[col].dtype == 'object':
                    sample[col] = mode_values[col]
                else:
                    sample[col] = median_values[col]
        
        # Set the selected category
        size_col = f"Size_{size}"
        region_col = f"Sales Region_{region}"
        sample[size_col] = 1
        sample[region_col] = 1
        
        # Generate daily predictions
        daily_predictions = []
        for date in date_range:
            # Update date features
            sample['Date'] = date
            sample['Year'] = date.year
            sample['Month'] = date.month
            sample['Day'] = date.day
            sample['Weekday'] = date.weekday()
            
            # Prepare prediction input
            X_pred = sample.drop(columns=['QTY(EA)', 'Date'], errors='ignore')
            
            if hasattr(model, 'feature_names_in_'):
                X_pred = X_pred.reindex(columns=model.feature_names_in_, fill_value=0)
            
            # Make prediction
            try:
                pred = max(0, float(model.predict(X_pred)[0]))
                daily_predictions.append(pred)
            except Exception as e:
                print(f"Prediction error for {date}: {str(e)}")
                daily_predictions.append(0)
        
        forecast_df['daily'] = daily_predictions
        
        # Aggregate based on granularity
        if granularity == 'weekly':
            result = forecast_df.resample('W-Mon').sum()
        elif granularity == 'monthly':
            result = forecast_df.resample('MS').sum()
        else:  # daily
            result = forecast_df
            
        result['predicted_sales'] = result['daily']
        return result[['predicted_sales']]
        
    except Exception as e:
        print(f"Forecast generation failed: {str(e)}")
        raise
        
        
    except Exception as e:
        print(f"Forecast generation failed: {str(e)}")
        raise