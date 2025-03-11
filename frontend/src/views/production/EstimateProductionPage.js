import React, { useState } from 'react'
import { estimateProduction } from '../api'

const EstimateProductionPage = () => {
  const [targetCount, setTargetCount] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await estimateProduction(targetCount)
      setResult(data)
      setError(null)
    } catch (error) {
      setError('Something went wrong! Please try again.')
    }
  }

  return (
    <div>
      <h2>Estimate Production</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Target Count:</label>
          <input
            type="number"
            value={targetCount}
            onChange={(e) => setTargetCount(parseInt(e.target.value))}
            required
          />
        </div>
        <button type="submit">Estimate</button>
      </form>

      {result && (
        <div>
          <h3>Estimation Result:</h3>
          <p>Estimated Production: {result.estimated_production}</p>
          <p>Defect Rate: {result.defect_rate}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default EstimateProductionPage
