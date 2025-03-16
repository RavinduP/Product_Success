// src/campaign_api.js
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:5001' // The base URL for the campaign Flask API

// Predict campaign type
export const predictCampaign = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/campaignPredict`, data)
    return response.data
  } catch (error) {
    console.error('Error in campaign ladder:', error)
    throw error
  }
}

// Additional functionality can be added here as needed
