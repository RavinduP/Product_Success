import React, { useState } from 'react'
import { predictDefect } from '/src/api'

const PredictionPage = () => {
  const [formData, setFormData] = useState({
    'Cutting ': 0,
    Punching: 0,
    Inboxing: 0,
    Hinging: 0,
    Riveting: 0,
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: parseFloat(value) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await predictDefect(formData)
      setResult(data)
      setError(null)
    } catch (error) {
      setError('Something went wrong! Please try again.')
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
          <p>Defect: {result.prediction}</p>
          <p>Probability: {result.probability}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default PredictionPage
