// src/components/ProductSelection/ProductSelection.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductSelection = ({ onSelect }) => {
  const [products, setProducts] = useState([]);
  const [allSizes, setAllSizes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/getAllData')
      .then(response => {
        const data = response.data;

        // Extract unique product types
        const productTypes = [...new Set(data.map(item => item.product_type))];
        setProducts(productTypes);

        // Store all sizes mapped to their product types
        const sizeMap = {};
        data.forEach(item => {
          if (!sizeMap[item.product_type]) {
            sizeMap[item.product_type] = new Set();
          }
          sizeMap[item.product_type].add(item.size);
        });

        // Convert sets to arrays
        for (let key in sizeMap) {
          sizeMap[key] = [...sizeMap[key]];
        }

        setAllSizes(sizeMap);
      })
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  const handleProductChange = (e) => {
    const product = e.target.value;
    setSelectedProduct(product);
    
    // Update sizes dynamically based on selected product type
    setSizes(allSizes[product] || []);
    setSelectedSize('');
    
    onSelect(product, '');
  };

  const handleSizeChange = (e) => {
    setSelectedSize(e.target.value);
    onSelect(selectedProduct, e.target.value);
  };

  return (
    <div className="product-selection">
      <label>Product Type:</label>
      <select value={selectedProduct} onChange={handleProductChange}>
        <option value="">Select Product</option>
        {products.map(product => (
          <option key={product} value={product}>{product}</option>
        ))}
      </select>

      <label>Size:</label>
      <select value={selectedSize} onChange={handleSizeChange} disabled={!selectedProduct}>
        <option value="">Select Size</option>
        {sizes.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
    </div>
  );
};

export default ProductSelection;
