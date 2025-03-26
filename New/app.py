import os
import joblib
import pandas as pd
import numpy as np
import matplotlib

matplotlib.use('Agg')  # Required for headless environments
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold, TimeSeriesSplit
from sklearn.metrics import (accuracy_score, roc_auc_score, classification_report,
                             confusion_matrix, roc_curve, auc, mean_squared_error, mean_absolute_error)
from sklearn.preprocessing import OneHotEncoder, StandardScaler, label_binarize
from imblearn.over_sampling import SMOTE
from itertools import cycle
from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder='static', template_folder='templates')

# =====================
# CONFIGURATION SETUP
# =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# Defects model paths
DEFECTS_DATA = os.path.join(DATA_DIR, "Defects_ladder.xlsx")
DEFECTS_MODEL = os.path.join(MODELS_DIR, "defects_model.pkl")

# Campaign model paths
CAMPAIGN_DATA = os.path.join(DATA_DIR, "Final_Dataset.csv")
CAMPAIGN_MODEL = os.path.join(MODELS_DIR, "campaign_model.pkl")
CAMPAIGN_ENCODER = os.path.join(MODELS_DIR, "campaign_encoder.pkl")
CAMPAIGN_SCALER = os.path.join(MODELS_DIR, "campaign_scaler.pkl")

SALES_MODEL = os.path.join(MODELS_DIR, "ladder_sales_prediction_pipeline.joblib")
SALES_DATA = os.path.join(DATA_DIR, "Ladders updated data.xlsx")
SALES_ENCODER_SIZE = os.path.join(MODELS_DIR, "sales_encoder_size.pkl")
SALES_ENCODER_REGION = os.path.join(MODELS_DIR, "sales_encoder_region.pkl")


# ======================
# UTILITY FUNCTIONS
# ======================
def create_directories():
    """Ensure required directories exist"""
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)


def handle_errors(func):
    """Decorator for error handling"""

    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            app.logger.error(f"Error in {func.__name__}: {str(e)}")
            raise

    return wrapper


# ======================
# DEFECTS MODEL SYSTEM
# ======================
@handle_errors
def load_defects_data():
    """Load and preprocess manufacturing defects data"""
    df = pd.read_excel(DEFECTS_DATA)
    df_clean = df.dropna().drop(columns=['Date', 'Product ID'])
    X = df_clean[['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting']]
    y = df_clean['Defect']
    return X, y


@handle_errors
def train_defects_model():
    """Train and save defects prediction model with performance metrics"""
    X, y = load_defects_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=2,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)

    # Calculate metrics
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    y_proba_test = model.predict_proba(X_test)[:, 1]

    # Print performance
    print("\n" + "=" * 60)
    print("🔧 Defects Model Performance:")
    print(f"Training Accuracy: {accuracy_score(y_train, y_pred_train):.4f}")
    print(f"Testing Accuracy:  {accuracy_score(y_test, y_pred_test):.4f}")
    print(f"ROC AUC Score:     {roc_auc_score(y_test, y_proba_test):.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred_test))
    print("=" * 60)

    joblib.dump(model, DEFECTS_MODEL)
    return model

def get_defects_model():
    """Load or train defects model"""
    try:
        model = joblib.load(DEFECTS_MODEL)
        app.logger.info("Defects model loaded from disk")
        return model
    except Exception as e:
        app.logger.warning(f"Training new defects model: {str(e)}")
        return train_defects_model()


# ======================
# CAMPAIGN MODEL SYSTEM
# ======================
@handle_errors
def load_campaign_data():
    """Load and preprocess marketing campaign data"""
    df = pd.read_csv(CAMPAIGN_DATA)
    df = df.drop(['Conversion_Rate', 'Target_Audience'], axis=1)
    df['Date'] = pd.to_datetime(df['Date'])
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df = df.drop('Date', axis=1)
    df['Duration'] = df['Duration'].str.extract('(\d+)').astype(int)

    encoder = OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')
    ad_type_encoded = encoder.fit_transform(df[['Ad_Type']])
    df[encoder.get_feature_names_out(['Ad_Type'])] = ad_type_encoded
    df = df.drop('Ad_Type', axis=1)

    X = df.drop('Campaign_Type', axis=1)
    y = pd.factorize(df['Campaign_Type'])[0]

    return X, y, encoder, df


@handle_errors
def train_campaign_model():
    """Train and save campaign prediction model with performance metrics"""
    X, y, encoder, df = load_campaign_data()
    smote = SMOTE(random_state=42, k_neighbors=2)
    X_res, y_res = smote.fit_resample(X, y)

    scaler = StandardScaler()
    numeric_cols = X.select_dtypes(include=np.number).columns
    X_res[numeric_cols] = scaler.fit_transform(X_res[numeric_cols])

    X_train, X_test, y_train, y_test = train_test_split(
        X_res, y_res, test_size=0.3, random_state=42, stratify=y_res
    )

    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [5, 10],
        'min_samples_split': [10, 20],
        'min_samples_leaf': [5, 10],
        'max_features': ['sqrt'],
        'class_weight': ['balanced']
    }

    model = GridSearchCV(
        RandomForestClassifier(random_state=42),
        param_grid,
        cv=StratifiedKFold(10, shuffle=True, random_state=42),
        scoring='accuracy',
        n_jobs=-1
    ).fit(X_train, y_train).best_estimator_

    # Calculate metrics
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    y_proba_test = model.predict_proba(X_test)

    # Print performance
    print("\n" + "=" * 60)
    print("📈 Campaign Model Performance:")
    print(f"Training Accuracy: {accuracy_score(y_train, y_pred_train):.4f}")
    print(f"Testing Accuracy:  {accuracy_score(y_test, y_pred_test):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred_test, target_names=df['Campaign_Type'].unique()))
    print("\nFeature Importances:")
    print(pd.DataFrame({
        'Feature': X.columns,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False).head(10))
    print("=" * 60)

    joblib.dump(model, CAMPAIGN_MODEL)
    joblib.dump(encoder, CAMPAIGN_ENCODER)
    joblib.dump(scaler, CAMPAIGN_SCALER)
    return model, encoder, scaler

def get_campaign_model():
    """Load or train campaign model"""
    try:
        model = joblib.load(CAMPAIGN_MODEL)
        encoder = joblib.load(CAMPAIGN_ENCODER)
        scaler = joblib.load(CAMPAIGN_SCALER)
        app.logger.info("Campaign model loaded from disk")
        return model, encoder, scaler
    except Exception as e:
        app.logger.warning(f"Training new campaign model: {str(e)}")
        return train_campaign_model()

# SALES MODEL SYSTEM
# ======================
@handle_errors
def load_sales_data():
    """Load and preprocess sales data with feature engineering"""
    data = pd.ExcelFile(SALES_DATA)
    df = data.parse('Data')

    # Preprocessing
    df['Date'] = pd.to_datetime(df['Billing Date'])
    df = df.sort_values(by='Date').reset_index(drop=True)

    # Date features
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df['Weekday'] = df['Date'].dt.weekday
    df['Quarter'] = df['Date'].dt.quarter
    df['DayOfYear'] = df['Date'].dt.dayofyear
    df['WeekOfYear'] = df['Date'].dt.isocalendar().week.astype(int)
    df['IsWeekend'] = df['Weekday'].apply(lambda x: 1 if x >= 5 else 0)
    df['IsMonthStart'] = df['Date'].dt.is_month_start.astype(int)
    df['IsMonthEnd'] = df['Date'].dt.is_month_end.astype(int)

    # Region mapping
    region_mapping = {
        "R1": "North", "R2": "Kandy", "R3": "Kurunagela",
        "R4": "Southern", "R5": "Negombo", "R6": "East",
        "R7": "Colombo", "R8": "Key Accounts", "PR": "Projects",
        "PR-EX": "Projects Export", "EX": "Exports", "DR": "Direct"
    }
    df["Sales Region"] = df["Sales Region"].replace(region_mapping)

    return df


@handle_errors
def train_sales_model():
    """Train and save sales forecasting model with feature engineering"""
    df = load_sales_data()

    # Feature engineering
    df['lag_7'] = df['QTY(EA)'].shift(7)
    df['lag_30'] = df['QTY(EA)'].shift(30)
    df['rolling_mean_7'] = df['QTY(EA)'].rolling(window=7).mean()
    df['rolling_std_7'] = df['QTY(EA)'].rolling(window=7).std()
    df['expanding_mean'] = df['QTY(EA)'].expanding().mean()
    df['season'] = df['Month'].apply(lambda m: (m % 12 + 3) // 3)
    df['weekday_season'] = df['Weekday'] * df['season']

    # Drop initial rows with NaN from lag features
    df = df.dropna()

    # Save feature medians for prediction
    feature_medians = df[['lag_7', 'lag_30', 'rolling_mean_7',
                          'rolling_std_7', 'expanding_mean']].median()
    joblib.dump(feature_medians, os.path.join(MODELS_DIR, "sales_feature_medians.pkl"))

    # One-hot encoding
    encoder_size = OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')
    encoder_region = OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')

    encoded_size = encoder_size.fit_transform(df[['Size']])
    encoded_region = encoder_region.fit_transform(df[['Sales Region']])

    df[encoder_size.get_feature_names_out(['Size'])] = encoded_size
    df[encoder_region.get_feature_names_out(['Sales Region'])] = encoded_region

    # Feature/target split
    X = df.drop(columns=['QTY(EA)', 'Date', 'Billing Date', 'Size', 'Sales Region'])
    y = df['QTY(EA)']

    # Time-based split
    tscv = TimeSeriesSplit(n_splits=5)
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]

    # Model training
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate model
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    print("\n" + "=" * 60)
    print("💰 Sales Model Performance:")
    print(f"RMSE: {rmse:.2f}")
    print(f"MAE:  {mae:.2f}")
    print("Feature Importances:")
    print(pd.DataFrame({
        'Feature': X.columns,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False).head(10))
    print("=" * 60)

    # Save artifacts
    joblib.dump(model, SALES_MODEL)
    joblib.dump(encoder_size, SALES_ENCODER_SIZE)
    joblib.dump(encoder_region, SALES_ENCODER_REGION)

    return model, encoder_size, encoder_region


def get_sales_model():
    """Load or train sales model"""
    try:
        model = joblib.load(SALES_MODEL)
        encoder_size = joblib.load(SALES_ENCODER_SIZE)
        encoder_region = joblib.load(SALES_ENCODER_REGION)
        app.logger.info("Sales model loaded successfully")
        return model, encoder_size, encoder_region
    except Exception as e:
        app.logger.warning(f"Training new sales model: {str(e)}")
        return train_sales_model()

# ======================
# FLASK ROUTES
# ======================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict/defects', methods=['POST'])
def predict_defects():
    try:
        data = request.json
        # Validate inputs are 0 or 1
        required_fields = ['cutting', 'punching', 'inboxing', 'hinging', 'riveting']
        for field in required_fields:
            value = data.get(field)
            if value not in (0, 1):
                return jsonify({'error': f'Invalid value for {field}. Must be 0 or 1'}), 400

        # Create properly formatted DataFrame
        features = pd.DataFrame([[
            data['cutting'],
            data['punching'],
            data['inboxing'],
            data['hinging'],
            data['riveting']
        ]], columns=['Cutting ', 'Punching', 'Inboxing', 'Hinging', 'Riveting'])

        model = get_defects_model()
        prediction = model.predict(features)[0]
        return jsonify({'prediction': int(prediction)})
    except Exception as e:
        app.logger.error(f"Defect prediction error: {str(e)}")
        return jsonify({'error': 'Prediction failed'}), 500


@app.route('/predict/campaign', methods=['POST'])
def predict_campaign():
    try:
        data = request.json
        app.logger.info(f"Received campaign prediction request: {data}")

        # Validate input data
        required_fields = ['adType', 'duration', 'budget', 'reach', 'impressions', 'clicks', 'date']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Load models and preprocessing tools
        model, encoder, scaler = get_campaign_model()
        _, _, _, df = load_campaign_data()
        campaign_types = df['Campaign_Type'].unique()

        # Create input DataFrame
        try:
            input_date = pd.to_datetime(data['date'])
            input_df = pd.DataFrame([{
                'Ad_Type': data['adType'],
                'Duration': int(data['duration']),
                'Budget': float(data['budget']),
                'Reach': int(data['reach']),
                'Impressions': int(data['impressions']),
                'Clicks': int(data['clicks']),
                'Year': input_date.year,
                'Month': input_date.month,
                'Day': input_date.day
            }])
        except Exception as e:
            app.logger.error(f"Data parsing error: {str(e)}")
            return jsonify({'error': 'Invalid data format'}), 400

        # Encode categorical features
        try:
            encoded = encoder.transform(input_df[['Ad_Type']])
            encoded_columns = encoder.get_feature_names_out(['Ad_Type'])
            input_df[encoded_columns] = encoded
        except ValueError as e:
            app.logger.error(f"Encoding error: {str(e)}")
            return jsonify({'error': 'Invalid ad type'}), 400

        # Prepare final input
        input_df = input_df.drop('Ad_Type', axis=1)

        # Ensure correct column order
        training_columns = model.feature_names_in_
        input_df = input_df.reindex(columns=training_columns, fill_value=0)

        # Scale features
        numeric_cols = input_df.select_dtypes(include=np.number).columns
        input_df[numeric_cols] = scaler.transform(input_df[numeric_cols])

        # Make prediction
        prediction = model.predict(input_df)[0]

        return jsonify({
            'prediction': campaign_types[prediction],
            'confidence': float(np.max(model.predict_proba(input_df)[0]))
        })

    except Exception as e:
        app.logger.error(f"Campaign prediction error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Prediction failed'}), 500

@app.route('/predict/sales', methods=['POST'])
def predict_sales():
    """Sales forecasting endpoint"""
    try:
        data = request.json
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        size = data.get('size')
        region = data.get('region')
        granularity = data.get('granularity', 'monthly')

        if not all([start_date, end_date, size, region]):
            return jsonify({'error': 'Missing required parameters'}), 400

        model, encoder_size, encoder_region = get_sales_model()
        forecast_df = generate_sales_forecast(
            model=model,
            encoder_size=encoder_size,
            encoder_region=encoder_region,
            start_date=start_date,
            end_date=end_date,
            size=size,
            region=region,
            granularity=granularity
        )

        return jsonify({
            'dates': forecast_df.index.strftime('%Y-%m-%d').tolist(),
            'predictions': forecast_df['predicted_sales'].tolist(),
            'total': float(forecast_df['predicted_sales'].sum()),
            'status': 'success'
        })
    except Exception as e:
        app.logger.error(f"Sales prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500


def generate_sales_forecast(model, encoder_size, encoder_region, start_date, end_date, size, region, granularity):
    """Generate forecast using trained model and encoders"""
    try:
        # Load feature medians
        feature_medians = joblib.load(os.path.join(MODELS_DIR, "sales_feature_medians.pkl"))
    except Exception as e:
        app.logger.error(f"Error loading feature medians: {str(e)}")
        feature_medians = pd.Series()

    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    forecast_df = pd.DataFrame(index=date_range, columns=['predicted_sales'])

    for date in date_range:
        # Create base features
        features = {
            'Year': date.year,
            'Month': date.month,
            'Day': date.day,
            'Weekday': date.weekday(),
            'Quarter': (date.month - 1) // 3 + 1,
            'DayOfYear': date.dayofyear,
            'WeekOfYear': date.isocalendar()[1],
            'IsWeekend': 1 if date.weekday() >= 5 else 0,
            'IsMonthStart': 1 if date == date.replace(day=1) else 0,
            'IsMonthEnd': 1 if date == date.replace(day=1) - pd.Timedelta(days=1) else 0,
            'season': (date.month % 12 + 3) // 3,
        }

        # Encode categorical features
        size_encoded = encoder_size.transform([[size]]).flatten()
        region_encoded = encoder_region.transform([[region]]).flatten()

        # Create feature names
        size_features = [f"Size_{cat}" for cat in encoder_size.categories_[0][1:]]
        region_features = [f"Sales Region_{cat}" for cat in encoder_region.categories_[0][1:]]

        # Combine all features
        feature_values = list(features.values()) + list(size_encoded) + list(region_encoded)
        feature_names = list(features.keys()) + size_features + region_features

        # Create DataFrame
        input_df = pd.DataFrame([feature_values], columns=feature_names)

        # Add lag/rolling features using saved medians
        for col in ['lag_7', 'lag_30', 'rolling_mean_7', 'rolling_std_7', 'expanding_mean']:
            input_df[col] = feature_medians.get(col, 0)

        # Ensure correct feature order
        input_df = input_df.reindex(columns=model.feature_names_in_, fill_value=0)

        # Predict
        prediction = max(0, model.predict(input_df)[0])
        forecast_df.loc[date, 'predicted_sales'] = prediction

    # Aggregate based on granularity
    if granularity == 'weekly':
        return forecast_df.resample('W').sum()
    elif granularity == 'monthly':
        return forecast_df.resample('MS').sum()
    return forecast_df

# ======================
# INITIALIZATION
# ======================
if __name__ == '__main__':
    create_directories()
    print("\n🚀 Initializing Models...")

    print("\n" + "=" * 60)
    print("Training Defects Model...")
    defects_model = train_defects_model()

    print("\n" + "=" * 60)
    print("Training Campaign Model...")
    campaign_model, campaign_encoder, campaign_scaler = train_campaign_model()

    print("\n" + "=" * 60)
    print("Training Sales Model...")
    sales_model, sales_encoder_size, sales_encoder_region = train_sales_model()

    print("\n" + "=" * 60)
    print("🌐 Starting Flask Server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
