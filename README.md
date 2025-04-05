---

# 🧠 Product Success Prediction & Insights System

This is a Flask-based web application designed to provide actionable insights into product success of aluminium using machine learning and deep learning techniques. It includes dashboards for four main components, sentiment analysis, market trends, production yield, and campaign performance.

---

## 💡 Prototype

Click the links below to view the interactive prototype that demonstrates the user interface and flow of the system:

Image 01 - ![image](https://github.com/user-attachments/assets/39ff27ea-70b2-428f-8bd6-308ec5dfa049)
Image 02 - ![image](https://github.com/user-attachments/assets/0d18cdba-9d3a-40e6-9023-1e367662bdc3)

---

## 📁 Project Structure

```
.
├── app.py                  # Flask backend entry point
├── requirements.txt        # Python dependencies
├── data/                   # Datasets
├── models/                 # Pretrained models and training scripts
├── resource/               # Static resource files
├── routes/                 # Flask routes
├── scripts/                # Data preprocessing & model training scripts
├── static/                 # CSS, JS, images
├── templates/              # HTML templates
│   ├── auth.html
│   ├── campaign.html
│   ├── dashboard.html
│   ├── index.html
│   ├── market.html
│   ├── production.html
│   ├── sentiment.html
│   └── sidebar.html
```

---

## 🚀 How to Run the Project

### 1. Install Dependencies

Create a virtual environment (optional but recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install the required packages:

- `flask`
- `flask-cors`
- `torch`
- `transformers`
- `pandas`
- `numpy`
- `matplotlib`
- `seaborn`
- `scikit-learn`
- `imbalanced-learn`
- `joblib`
- `pymongo`
- `xgboost`

### 2. Start the Flask Backend

```bash
python app.py
```

The server will start at `http://127.0.0.1:5000/`.

### 3. Launch the Frontend

Use the **Live Server** extension in VS Code to open `templates/index.html` in your browser.

Ensure the Flask backend is running before interacting with the frontend.

---

## 📌 Notes

- Ensure that MongoDB is running (if used) when launching the system.
- Scripts for training and evaluating models can be found in the `models/` and `scripts/` directories.
- The interface includes navigation through various dashboards like production, market, sentiment, and campaign analysis.

---
