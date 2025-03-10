// src/api.js
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:5000'

// Predict defect
export const predictDefect = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/predict`, data)
    return response.data
  } catch (error) {
    console.error('Error in prediction:', error)
    throw error
  }
}

// Estimate production
export const estimateProduction = async (targetCount) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/estimate_production`, {
      target_count: targetCount,
    })
    return response.data
  } catch (error) {
    console.error('Error in estimating production:', error)
    throw error
  }
}
