// static/script.js

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

    // Validation function (matches your React logic)
    function validateForm(formData, currentDate) {
        const errors = {};
        const selectedDate = new Date(formData.date);

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
        } else if (selectedDate <= currentDate) {
            errors.date = "Date must be in the future.";
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

    // Submit to Flask backend
    function submitForm(formData) {
        fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(result => {
            document.getElementById('result').textContent = `Predicted Campaign Type: ${result.prediction}`;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').textContent = 'Error making prediction. Please try again.';
        });
    }
});