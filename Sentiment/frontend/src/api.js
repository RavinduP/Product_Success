// api.js
const API_URL = "http://localhost:5000"; // Your Flask API URL

// Function to fetch products and sizes
export const fetchProducts = async () => {
    const response = await fetch(`${API_URL}/api/products`);
    const data = await response.json();
    return data;
};

// Function to send text for sentiment prediction
export const predictSentiment = async (text) => {
    const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    const data = await response.json();
    return data;
};

// Function to handle CSV upload for report generation
export const uploadCSV = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    return data;
};
