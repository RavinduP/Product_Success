document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('campaignForm');
    const currentDate = new Date();
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        clearErrors();

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
        const errors = validateForm(formData, currentDate);
    
        if (Object.keys(errors).length === 0) {
            submitForm(formData);
        } else {
            displayErrors(errors);
        }
    });

    // Validation function
    function validateForm(formData, currentDate) {
        const errors = {};
        const selectedDate = new Date(formData.date);

        // Duration validation
        if (!formData.duration || formData.duration <= 0) {
            errors.duration = "Please select a valid duration";
        }

        // Ad Budget validation
        if (!formData.adBudget || formData.adBudget <= 0) {
            errors.adBudget = "Please select a valid budget range";
        }

        // Reach validation
        if (!formData.reach || formData.reach < 0) {
            errors.reach = "Reach must be a positive number";
        }

        // Clicks validation
        if (!formData.clicks || formData.clicks < 0) {
            errors.clicks = "Clicks must be a positive number";
        }

        // Impressions validation
        if (!formData.impressions || formData.impressions < 0) {
            errors.impressions = "Impressions must be a positive number";
        }

        // Ad Type validation
        if (!formData.adType) {
            errors.adType = "Please select an ad platform";
        }

        // Date validation
        if (!formData.date) {
            errors.date = "Please select a valid date";
        } else if (selectedDate <= currentDate) {
            errors.date = "Date must be in the future";
        }

        return errors;
    }

    // Display errors under each field
    function displayErrors(errors) {
        for (const [field, message] of Object.entries(errors)) {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = message;
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

    // Submit to Flask backend
    function submitForm(formData) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<div class="loading">Processing your prediction...</div>';
        
        fetch('http://127.0.0.1:5000/campaign/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            const resultHTML = `
                <h3>Prediction Result</h3>
                <div class="result-card">
                    <div class="result-main">
                        <span class="result-label">Recommended Campaign Type:</span>
                        <span class="result-value highlight">${result.prediction}</span>
                    </div>
                    <div class="result-main">
                        <span class="result-label">Confidence Level:</span>
                        <span class="result-value">${result.confidence}%</span>
                    </div>
                    
                    <div class="probability-breakdown">
                        <h4>Probability Breakdown</h4>
                        <div class="probability-bars">
                            <div class="probability-item">
                                <span class="probability-label">Mega</span>
                                <div class="probability-bar-container">
                                    <div class="probability-bar" style="width: ${result.probabilities.Mega}%"></div>
                                    <span class="probability-value">${result.probabilities.Mega}%</span>
                                </div>
                            </div>
                            <div class="probability-item">
                                <span class="probability-label">General</span>
                                <div class="probability-bar-container">
                                    <div class="probability-bar" style="width: ${result.probabilities.General}%"></div>
                                    <span class="probability-value">${result.probabilities.General}%</span>
                                </div>
                            </div>
                            <div class="probability-item">
                                <span class="probability-label">Social Media</span>
                                <div class="probability-bar-container">
                                    <div class="probability-bar" style="width: ${result.probabilities['Social Media']}%"></div>
                                    <span class="probability-value">${result.probabilities['Social Media']}%</span>
                                </div>
                            </div>
                            <div class="probability-item">
                                <span class="probability-label">Influencer</span>
                                <div class="probability-bar-container">
                                    <div class="probability-bar" style="width: ${result.probabilities.Influencer}%"></div>
                                    <span class="probability-value">${result.probabilities.Influencer}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            resultDiv.innerHTML = resultHTML;
        })
        .catch(error => {
            console.error('Error:', error);
            resultDiv.innerHTML = '<div class="error-message">Error making prediction. Please try again.</div>';
        });
    }
});