import React, { useState } from "react";
import "./CSVUpload.css"; // Import the CSS file

const CSVUpload = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError("");
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict_csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSummary(data);
      } else {
        setError(data.error || "Error processing the file.");
      }
    } catch (error) {
      setError("Failed to upload file. Check API connection.");
    }
  };

  return (
    <div className="csv-upload-container">
      {/* Left section: Upload container */}
      <div className="upload-section">
        <h2>Upload CSV for Sentiment Analysis</h2>
        <label htmlFor="file-upload" className="custom-file-upload">
          Choose CSV File
        </label>
        <input id="file-upload" type="file" accept=".csv" onChange={handleFileChange} />
        <button onClick={handleUpload}>Analyze Sentiment</button>
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Right section: Summary container */}
      {summary && (
        <div className="summary-section">
          <h3>Sentiment Summary</h3>
          <ul>
            {Object.entries(summary).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CSVUpload;