document.addEventListener('DOMContentLoaded', function() {
    // Initialize product panel interactions
    const productItems = document.querySelectorAll('.product-item:not(.has-subitems), .subitem');
    const formContainer = document.getElementById('defects-form');

    productItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active states
            document.querySelectorAll('.product-item, .subitem').forEach(i => {
                i.classList.remove('active');
            });
            this.classList.add('active');

            // Only show form for Multi-purpose Ladders
            if (this.textContent.includes('Multi-purpose Ladders')) {
                formContainer.classList.add('active');
            } else {
                formContainer.classList.remove('active');
            }
        });
    });

    // Defects Form Handling
    document.getElementById('defectsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const resultDiv = document.getElementById('defectsResult');
        resultDiv.textContent = 'Processing...';
        resultDiv.className = 'result';

        // Validate inputs first
        const inputs = ['cutting', 'punching', 'inboxing', 'hinging', 'riveting'];
        let valid = true;

        const formData = {};
        inputs.forEach(id => {
            const value = parseInt(document.getElementById(id).value);
            if (value < 0 || value > 1 || isNaN(value)) {
                valid = false;
                document.getElementById(id).classList.add('invalid');
            } else {
                document.getElementById(id).classList.remove('invalid');
                formData[id] = value;
            }
        });

        if (!valid) {
            resultDiv.textContent = 'Please enter only 0 or 1 values';
            resultDiv.className = 'result bad';
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/production_yield/predict', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Server error');

            const result = await response.json();
            resultDiv.textContent = result.prediction === 1 ?
                'DEFECT DETECTED!' : 'No Defect Detected';
            resultDiv.className = `result ${result.prediction === 1 ? 'bad' : 'good'}`;
        } catch (error) {
            resultDiv.textContent = 'Prediction failed';
            resultDiv.className = 'result bad';
            console.error('Error:', error);
        }
    });
});