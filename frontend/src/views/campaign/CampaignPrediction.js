import React, { useState } from 'react'
import { predictCampaign } from '/src/campaign_api' // Importing the predictCampaign function

const CampaignPrediction = () => {
  const [formData, setFormData] = useState({
    duration: 0, // Number of days the campaign runs
    adBudget: 0, // Ad budget in dollars
    reach: 0, // Reach in number of people
    clicks: 0, // Clicks on the ad
    impressions: 0, // Number of ad impressions
    adType: '', // Ad type as a string, e.g., 'Video' or 'Banner'
    date: '', // Date field in YYYY-MM-DD format
  })
  const [result, setResult] = useState(null) // Stores the ladder result
  const [error, setError] = useState(null) // Stores error messages

  // Update state on input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null) // Reset error state
    setResult(null) // Reset result state
    try {
      const response = await predictCampaign(formData) // Call the API through predictCampaign
      setResult(response) // Set the result to the API response
    } catch (err) {
      console.error('Error during API call:', err) // Log the error for debugging
      setError('Something went wrong! Please try again.') // Set the error state
    }
  }

  return (
    <div>
      <h2>Campaign Type Prediction</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Duration:</label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Ad Budget:</label>
          <input
            type="number"
            name="adBudget"
            value={formData.adBudget}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Reach:</label>
          <input
            type="number"
            name="reach"
            value={formData.reach}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Clicks:</label>
          <input
            type="number"
            name="clicks"
            value={formData.clicks}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Impressions:</label>
          <input
            type="number"
            name="impressions"
            value={formData.impressions}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Ad Type:</label>
          <input
            type="text"
            name="adType"
            value={formData.adType}
            onChange={handleChange}
            placeholder="e.g., Video, Banner"
            required
          />
        </div>
        <div>
          <label>Date:</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
        <button type="submit">Predict</button>
      </form>

      {/* Display result if available */}
      {result && (
        <div>
          <h3>Prediction Result:</h3>
          <p>Campaign Type: {result.prediction}</p>
          <p>Details: {result.details || 'No additional details available.'}</p>
        </div>
      )}
      {/* Display error if any */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default CampaignPrediction
