// src/components/MainPage.js
import React, { useState } from 'react';
import axios from 'axios';
import ProductSelection from './ProductSelection/ProductSelection';
import LineChart from './LineChart/LineChart';
import '../styles/Main.css';

const MainPage = () => {
    const [fullData, setFullData] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;
  
    const handleSelectionChange = (productType, size) => {
      axios.get('http://127.0.0.1:5000/getAllData')
        .then(response => {
          const data = response.data.filter(item => item.product_type === productType && item.size === size);
          setFullData(data); // Store all filtered data
          setCurrentPage(0); // Reset pagination
        })
        .catch(error => console.error("Error fetching filtered data:", error));
    };
  
    const handleNext = () => {
      if ((currentPage + 1) * pageSize < fullData.length) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    const handlePrevious = () => {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    };
  
    return (
      <div className="main-container">
        <ProductSelection onSelect={handleSelectionChange} />
  
        {fullData.length > 0 && (
          <LineChart data={fullData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)} />
        )}
  
        <div className="button-container">
          <button onClick={handlePrevious} disabled={currentPage === 0}>⇐</button>
          <button onClick={handleNext} disabled={(currentPage + 1) * pageSize >= fullData.length}>⇒</button>
        </div>
      </div>
    );
  };
  
  export default MainPage;