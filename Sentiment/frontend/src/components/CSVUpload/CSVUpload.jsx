import React, { useState } from "react";
import "./CSVUpload.css"; // Import the CSS file

const CSVUpload = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
  
    if (!selectedFile) {
      setError("No file selected.");
      return;
    }
  
    // Check if file is a CSV
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Only CSV files are allowed.");
      setFile(null); // Reset file selection
      setSuccessMsg(""); // Remove success message
      return;
    }
  
    // Reset previous report and messages when a new file is selected
    setFile(selectedFile);
    setSummary(null); // Clear previous report
    setError("");
    setSuccessMsg("File uploaded successfully!"); // Show success message

    // Automatically hide the success message after 3 seconds
    setTimeout(() => setSuccessMsg(""), 3000);
  };
  

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);

    setError("");
    setSummary(null); // Ensure report clears when starting analysis
    setLoading(true); // Start loading
    
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

    setLoading(false); // Stop loading once response is received
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
        

        {/* Show success message immediately after file selection */}
        {successMsg && <p className="success-message">{successMsg}</p>}

        {/* Analyze button should always be visible */}
        <button onClick={handleUpload} disabled={!file}>
          Analyze Sentiment
        </button>

        {/* Loading message (only shown when analyzing) */}
        {loading && <p className="loading-message">Analyzing file, please wait...</p>}

        {/* Error message */}
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Right section: Summary container */}
      {summary && !loading && ( // Ensure summary is shown only after loading completes
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