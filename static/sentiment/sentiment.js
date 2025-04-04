const API_URL = "http://127.0.0.1:5000/sentiment";
let chart = null;
let historicalChart = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileRemove = document.getElementById('fileRemove');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const downloadPdf = document.getElementById('downloadPdf');
    const dropAreaText = dropArea.querySelector('p');

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
        dropAreaText.textContent = 'Drop your CSV file here';
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
        dropAreaText.textContent = 'Drag & Drop your CSV file here or click to browse';
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                handleFile(file);
            }
        }
    }

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (validateFile(file)) {
                handleFile(file);
            }
        }
    });

    fileRemove.addEventListener('click', function() {
        resetFileInput();
    });

    downloadPdf.addEventListener('click', function() {
        generatePdfReport();
    });

    function validateFile(file) {
        const validTypes = ['text/csv', 'application/vnd.ms-excel'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(file.type) && fileExtension !== 'csv') {
            alert('Please upload a valid CSV file.');
            return false;
        }
        return true;
    }

    function handleFile(file) {
        fileName.textContent = file.name;
        filePreview.style.display = 'block';
        dropArea.style.display = 'none';
        analyzeBtn.disabled = false;
    }

    function resetFileInput() {
        fileInput.value = '';
        fileName.textContent = '';
        filePreview.style.display = 'none';
        dropArea.style.display = 'block';
        analyzeBtn.disabled = true;
        document.getElementById('resultsCard').style.display = 'none';
        document.getElementById('summaryPlaceholder').style.display = 'flex';
        document.getElementById('summaryResults').innerHTML = '';
    }
});

function initializeHistoricalChart() {
    const ctx = document.getElementById('historicalChart').getContext('2d');
    
    // Sample historical data - replace with real data from your API
    const historicalData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        positive: [65, 59, 80, 81, 56, 72],
        neutral: [28, 48, 40, 19, 36, 20],
        negative: [7, 13, 10, 10, 8, 8]
    };

    historicalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.labels,
            datasets: [
                {
                    label: 'Positive',
                    data: historicalData.positive,
                    borderColor: 'rgba(39, 174, 96, 1)',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Neutral',
                    data: historicalData.neutral,
                    borderColor: 'rgba(158, 158, 158, 1)',
                    backgroundColor: 'rgba(158, 158, 158, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Negative',
                    data: historicalData.negative,
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Monthly Sentiment Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            }
        }
    });
}

async function uploadCSV() {
    const fileInput = document.getElementById("fileInput").files[0];
    const analyzeBtn = document.getElementById("analyzeBtn");
    
    if (!fileInput) {
        alert("Please select a CSV file.");
        return;
    }

    // Add loading state to button
    analyzeBtn.classList.add("loading-btn");
    
    // Add analyzing state to results card
    const resultsCard = document.getElementById("resultsCard");
    resultsCard.classList.add("analyzing-state");

    let formData = new FormData();
    formData.append("file", fileInput);

    try {
        let response = await fetch(`${API_URL}/predict_csv`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while analyzing the file. Please try again.");
    } finally {
        // Remove loading states
        analyzeBtn.classList.remove("loading-btn");
        resultsCard.classList.remove("analyzing-state");
    }
}

function displayResults(data) {
    // Make results card visible
    document.getElementById("summaryPlaceholder").style.display = 'none';
    document.getElementById("summaryResults").style.display = 'block';
    
    // Calculate percentages
    const total = data.total || Object.values(data.sentiment_counts).reduce((a, b) => a + b, 0);
    const percentages = {};
    Object.keys(data.sentiment_counts).forEach(key => {
        percentages[key] = ((data.sentiment_counts[key] / total) * 100).toFixed(1);
    });

    // Update summary card
    const summaryHTML = `
        <div class="summary-stats">
            <div class="stat-item positive">
                <div class="stat-value">${percentages.Positive || 0}%</div>
                <div class="stat-label">Positive</div>
            </div>
            <div class="stat-item neutral">
                <div class="stat-value">${percentages.Neutral || 0}%</div>
                <div class="stat-label">Neutral</div>
            </div>
            <div class="stat-item negative">
                <div class="stat-value">${percentages.Negative || 0}%</div>
                <div class="stat-label">Negative</div>
            </div>
        </div>
        <div class="summary-details">
            <h4>Key Insights</h4>
            <ul>
                <li>Total feedback analyzed: ${total}</li>
                <li>Most common sentiment: ${getDominantSentiment(data.sentiment_counts)}</li>
                ${data.samples ? `<li>Sample size for verification: ${data.samples.length}</li>` : ''}
            </ul>
        </div>
    `;
    document.getElementById("summaryResults").innerHTML = summaryHTML;

    // Update detailed results
    const samplesHTML = data.samples ? `
        <h3>Sample Analysis</h3>
        <div class="sample-items">
            ${data.samples.map(sample => `
                <div class="sample-item ${sample.sentiment.toLowerCase()}">
                    <div class="sample-sentiment">${sample.sentiment}</div>
                    <div class="sample-text">"${sample.text}"</div>
                </div>
            `).join('')}
        </div>
    ` : '';
    document.getElementById("sampleResults").innerHTML = samplesHTML;

    updateChart(data.sentiment_counts);
}

function getDominantSentiment(sentimentCounts) {
    let maxCount = 0;
    let dominant = '';
    for (const [sentiment, count] of Object.entries(sentimentCounts)) {
        if (count > maxCount) {
            maxCount = count;
            dominant = sentiment;
        }
    }
    return dominant;
}

function updateChart(data) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    
    if (chart) chart.destroy();
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(39, 174, 96, 0.7)',  // Positive (green)
                    'rgba(158, 158, 158, 0.7)',  // Neutral (gray)
                    'rgba(231, 76, 60, 0.7)'    // Negative (red)
                ],
                borderColor: [
                    'rgba(39, 174, 96, 1)',
                    'rgba(158, 158, 158, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function generatePdfReport() {
    const { jsPDF } = window.jspdf;
    const resultsCard = document.getElementById('resultsCard');
    const fileName = document.getElementById('fileName').textContent || 'swisstek_sentiment_analysis';
    
    html2canvas(resultsCard).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`${fileName}_report.pdf`);
    });
}