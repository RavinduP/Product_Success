// static/script.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize default tab
    switchTab('defects');

    // Tab click handlers
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabname = this.getAttribute('data-tab');
            switchTab(tabname);
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
        const response = await fetch('/predict/defects', {
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

    // Campaign Form Handling
    document.getElementById('campaignForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const resultDiv = document.getElementById('campaignResult');
        resultDiv.textContent = 'Processing...';
        resultDiv.className = 'result';

        const formData = {
            adType: document.getElementById('adType').value,
            duration: parseInt(document.getElementById('duration').value),
            budget: parseFloat(document.getElementById('budget').value),
            reach: parseInt(document.getElementById('reach').value),
            impressions: parseInt(document.getElementById('impressions').value),
            clicks: parseInt(document.getElementById('clicks').value),
            date: document.getElementById('date').value
        };

        try {
            const response = await fetch('/predict/campaign', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.error) {
                resultDiv.textContent = result.error;
                resultDiv.className = 'result bad';
            } else {
                resultDiv.textContent = `Recommended: ${result.prediction} (${(result.confidence * 100).toFixed(1)}% confidence)`;
                resultDiv.className = 'result good';
            }
        } catch (error) {
            resultDiv.textContent = 'Prediction failed';
            resultDiv.className = 'result bad';
            console.error('Error:', error);
        }
    });

    // Sales Form Handling
    document.getElementById('salesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const resultDiv = document.getElementById('salesResult');
        resultDiv.textContent = 'Processing...';
        resultDiv.className = 'result';

        const formData = {
            region: document.getElementById('region').value,
            size: document.getElementById('size').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            granularity: document.getElementById('granularity').value
        };

        try {
            const response = await fetch('/predict/sales', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.error) {
                resultDiv.textContent = result.error;
                resultDiv.className = 'result bad';
            } else {
                resultDiv.textContent = '';
                renderChart(result.dates, result.predictions);
                resultDiv.className = 'result good';
            }
        } catch (error) {
            resultDiv.textContent = 'Forecast failed';
            resultDiv.className = 'result bad';
            console.error('Error:', error);
        }
    });

    function switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.form-container').forEach(tab => {
            tab.style.display = 'none';
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-form`).style.display = 'block';
        // Mark active tab button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    function renderChart(dates, predictions) {
        const container = document.getElementById('chartContainer');
        container.innerHTML = '';

        const maxValue = Math.max(...predictions);

        predictions.forEach((value, index) => {
            const barContainer = document.createElement('div');
            barContainer.style.display = 'flex';
            barContainer.style.flexDirection = 'column';
            barContainer.style.alignItems = 'center';
            barContainer.style.margin = '0 5px';

            const bar = document.createElement('div');
            bar.style.height = `${(value / maxValue) * 150}px`;
            bar.style.width = '40px';
            bar.style.backgroundColor = '#4a6bd6';
            bar.style.borderRadius = '3px 3px 0 0';

            const label = document.createElement('div');
            label.textContent = dates[index];
            label.style.marginTop = '5px';
            label.style.fontSize = '0.8rem';
            label.style.textAlign = 'center';

            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            container.appendChild(barContainer);
        });
    }
});