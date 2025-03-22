// src/App.js
import React from 'react';
import MainPage from './components/Main';
import SentimentAnalyzer from './components/SentimentAnalyzer/SentimentAnalyzer';
import CSVUpload from './components/CSVUpload/CSVUpload';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Sentiment Analysis</h1>
      <MainPage />
      <CSVUpload />
      {/* <SentimentAnalyzer />     */}
    </div>
  );
}

export default App;
