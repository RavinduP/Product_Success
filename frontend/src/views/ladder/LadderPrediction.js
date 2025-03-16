import React, { useState } from 'react'
import { predictDefect } from '/src/api'

const LadderPrediction = () => {
  const [formData, setFormData] = useState({
    Cutting: 0,
    Punching: 0,
    Inboxing: 0,
    Hinging: 0,
    Riveting: 0,
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: parseFloat(value) || 0 })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null) // Reset the error state
    setResult(null) // Reset the result state
    try {
      const data = await predictDefect(formData)
      console.log('API Response:', data) // Debug: log the API response
      setResult(data)
    } catch (err) {
      console.error('Prediction API Error:', err) // Debugging: log the error
      setError('Something went wrong! Please try again.') // Set error state
    }
  }

  return (
    <div>
      <h2>Defect Prediction</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => (
          <div key={key}>
            <label>{key}:</label>
            <input
              type="number"
              name={key}
              value={formData[key]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <button type="submit">Predict</button>
      </form>

      {result && (
        <div>
          <h3>Prediction Result:</h3>
          <p>Defect: {result.prediction || 'No ladder available'}</p>
          <p>Probability: {result.probability || 'No probability available'}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default LadderPrediction
