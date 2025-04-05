import pandas as pd
import json
from pathlib import Path

def clean_campaign_type(value):
    """Standardize campaign type values"""
    if pd.isna(value) or str(value).strip().lower() in ["no", "n/a", "none", ""]:
        return "No Campaign"
    return str(value).strip()

def convert_excel_to_json(excel_path, json_path):
    try:
        # Read Excel file
        df = pd.read_excel(excel_path, sheet_name="Sheet1")
        
        # Clean and transform data
        df["Campaign Type"] = df["Campaign Type"].apply(clean_campaign_type)
        
        # Ensure proper data formatting
        df["Year"] = df["Year"].astype(str).str.strip().str[:4]  # Take first 4 digits if longer
        df["Month"] = df["Month"].astype(str).str.strip()
        df["Ad Budget"] = pd.to_numeric(df["Ad Budget"], errors='coerce').fillna(0)
        
        # Select required columns
        columns_to_keep = [
            "Year", "Month", 
            "Sales Revenue - Physical", 
            "Sales Revenue - Online", 
            "Campaign Type",
            "Ad Budget",
            "Discount",
            "Ad Type"
        ]
        df = df[columns_to_keep]
        
        # Convert to JSON
        df.to_json(json_path, orient="records", indent=2, default_handler=str)
        
        print(f"Success! JSON saved to {json_path}")
        print("Sample data:", df.head(3).to_dict(orient='records'))
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    INPUT_EXCEL = Path("data/actual_dataset.xlsx")
    OUTPUT_JSON = Path("data/dataset.json")    
    OUTPUT_JSON.parent.mkdir(exist_ok=True)
    success = convert_excel_to_json(INPUT_EXCEL, OUTPUT_JSON)
    if not success:
        print("Conversion failed. Check error message above.")