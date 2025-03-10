import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [prediction, setPrediction] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    duration: '',
    adBudget: '',
    reach: '',
    clicks: '',
    impressions: '',
    adType: 'Facebook',
    date: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    let newErrors = {};
    const currentDate = new Date();
    const selectedDate = new Date(formData.date);
    
    // Validate duration
    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = "Duration must be a positive number and greater than 0.";
    }

    // Validate ad budget
    if (!formData.adBudget || formData.adBudget < 100) {
      newErrors.adBudget = "Ad budget must be at least 100.";
    }

    // Validate reach
    if (!formData.reach || formData.reach < 0) {
      newErrors.reach = "Reach must be a positive number.";
    }

    // Validate clicks
    if (!formData.clicks || formData.clicks < 0) {
      newErrors.clicks = "Clicks must be a positive number.";
    }

    // Validate impressions
    if (!formData.impressions || formData.impressions < 0) {
      newErrors.impressions = "Impressions must be a positive number.";
    }

    // Validate future date
    if (!formData.date) {
      newErrors.date = "Please select a valid month and year.";
    } else if (selectedDate <= currentDate) {
      newErrors.date = "Date must be in the future.";
    }

    setErrors(newErrors);
    
    // If no errors, return true
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', formData);
      setPrediction(response.data.prediction);
    } catch (error) {
      console.error('Error:', error);
      setPrediction("Error: Unable to fetch prediction. Please try again later.");
    }
  };

  return (
    <div className="container">
      <h1>Campaign Type Predictor</h1>
      <form id="campaignForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="duration">Duration (in days):</label>
          <input type="number" id="duration" name="duration" value={formData.duration} onChange={handleChange} required className={errors.duration ? "error-input" : ""} />
          {errors.duration && <p className="error">{errors.duration}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="adBudget">Ad Budget:</label>
          <input type="number" id="adBudget" name="adBudget" value={formData.adBudget} onChange={handleChange} required className={errors.adBudget ? "error-input" : ""} />
          {errors.adBudget && <p className="error">{errors.adBudget}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="reach">Reach:</label>
          <input type="number" id="reach" name="reach" value={formData.reach} onChange={handleChange} required className={errors.reach ? "error-input" : ""} />
          {errors.reach && <p className="error">{errors.reach}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="clicks">Clicks:</label>
          <input type="number" id="clicks" name="clicks" value={formData.clicks} onChange={handleChange} required className={errors.clicks ? "error-input" : ""} />
          {errors.clicks && <p className="error">{errors.clicks}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="impressions">Impressions:</label>
          <input type="number" id="impressions" name="impressions" value={formData.impressions} onChange={handleChange} required className={errors.impressions ? "error-input" : ""} />
          {errors.impressions && <p className="error">{errors.impressions}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="adType">Ad Type:</label>
          <select id="adType" name="adType" value={formData.adType} onChange={handleChange} required>
            <option value="Facebook">Facebook</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Instagram">Instagram</option>
            <option value="Website">Website</option>
            <option value="YouTube">YouTube</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date">Date (Month and Year):</label>
          <input type="month" id="date" name="date" value={formData.date} onChange={handleChange} required className={errors.date ? "error-input" : ""} />
          {errors.date && <p className="error">{errors.date}</p>}
        </div>
        <button type="submit">Predict Campaign Type</button>
      </form>

      <h2>Prediction Result:</h2>
      <p id="result">{prediction}</p>
    </div>
  );
}

export default App;