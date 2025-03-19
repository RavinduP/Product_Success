// src/components/SentimentAnalyzer/SentimentAnalyzer.js
import React, { useState } from 'react';
import axios from 'axios';
import './SentimentAnalyzer.css';

const SentimentAnalyzer = () => {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = () => {
    if (!text.trim()) {
      setError("Please enter a text to analyze.");
      return;
    }

    setError(null);

    axios.post('http://127.0.0.1:5000/predict', { text })
      .then(response => setSentiment(response.data.sentiment))
      .catch(error => setError("Error analyzing sentiment."));
  };

  return (
    <div className="sentiment-container">
      <h2>Sentiment Analysis</h2>
      <textarea
        placeholder="Enter text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <button onClick={handleAnalyze}>Analyze</button>

      {error && <p className="error">{error}</p>}
      {sentiment && <p className="result">Sentiment: <strong>{sentiment}</strong></p>}
    </div>
  );
};

export default SentimentAnalyzer;
