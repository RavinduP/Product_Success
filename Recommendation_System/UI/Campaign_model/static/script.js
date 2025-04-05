// static/script.js

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('campaignForm');
    const currentDate = new Date();
    
    // Check if backend is operational
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            if (!data.models_loaded) {
                document.getElementById('result').innerHTML = 
                    `<div class="error-message">Warning: Model files are not properly loaded. Predictions may not work.</div>`;
            }
        })
        .catch(error => {
            document.getElementById('result').innerHTML = 
                `<div class="error-message">Unable to connect to server: ${error.message}</div>`;
        });
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        clearErrors();
        
        // Show loading state
        document.getElementById('result').innerHTML = '<div class="loading">Processing...</div>';

        // Get form data
        const formData = {
            duration: parseInt(form.duration.value),
            adBudget: parseFloat(form.adBudget.value),
            reach: parseFloat(form.reach.value),
            clicks: parseFloat(form.clicks.value),
            impressions: parseFloat(form.impressions.value),
            adType: form.adType.value,
            date: form.date.value
        };

        // Validate inputs
        const errors = validateForm(formData);
    
        if (Object.keys(errors).length === 0) {
            submitForm(formData);
        } else {
            displayErrors(errors);
            document.getElementById('result').textContent = '';
        }
    });

    // Improved validation function
    function validateForm(formData) {
        const errors = {};

        // Duration validation
        if (!formData.duration || formData.duration <= 0) {
             errors.duration = "Duration must be a positive number and greater than 0.";
        }

        // Ad Budget validation
        if (!formData.adBudget || formData.adBudget < 100) {
            errors.adBudget = "Ad budget must be at least 100.";
        }

        // Reach validation
        if (!formData.reach || formData.reach < 0) {
            errors.reach = "Reach must be a positive number.";
        }

        // Clicks validation
        if (!formData.clicks || formData.clicks < 0) {
            errors.clicks = "Clicks must be a positive number.";
        }

        // Impressions validation
        if (!formData.impressions || formData.impressions < 0) {
            errors.impressions = "Impressions must be a positive number.";
        }

        // Date validation
        if (!formData.date) {
            errors.date = "Please select a valid month and year.";
        } else {
            // Compare the selected date with the current date
            const selectedDate = new Date(formData.date);
            // Set day to 1 for both dates to compare just year and month
            selectedDate.setDate(1);
            const today = new Date();
            today.setDate(1);
            
            // If the selected date is not in the future
            if (selectedDate <= today) {
                errors.date = "Date must be in the future.";
            }
        }

        return errors;
    }

    // Display errors under each field
    function displayErrors(errors) {
        for (const [field, message] of Object.entries(errors)) {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.color = "red";
            }
        }
    }

    // Clear previous errors
    function clearErrors() {
        const errorElements = document.querySelectorAll('.error');
        errorElements.forEach(el => {
            el.textContent = '';
        });
    }

    // Submit to Flask backend with improved error handling
    function submitForm(formData) {
        fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.error) {
                document.getElementById('result').innerHTML = 
                    `<div class="error-message">Error: ${result.error}</div>`;
            } else {
                // Create a more detailed result display
                const resultHTML = `
                    <div class="prediction-result">
                        <div class="prediction-type">Predicted Campaign Type: <span class="highlight">${result.prediction}</span></div>
                        <div class="confidence">Confidence: ${result.confidence}%</div>
                        
                        <div class="probabilities">
                            <h3>Probability Breakdown:</h3>
                            <ul>
                                <li>Mega: ${result.probabilities.Mega}%</li>
                                <li>General: ${result.probabilities.General}%</li>
                                <li>Social Media: ${result.probabilities['Social Media']}%</li>
                                <li>Influencer: ${result.probabilities.Influencer}%</li>
                            </ul>
                        </div>
                    </div>
                `;
                document.getElementById('result').innerHTML = resultHTML;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').innerHTML = 
                `<div class="error-message">Error making prediction: ${error.message}</div>`;
        });
    }
});