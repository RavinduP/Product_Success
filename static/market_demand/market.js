// static/market_demand/market.js
$(document).ready(function() {
    // Initialize UI with data from hidden div
// Replace the initialization code with this more robust version
    try {
        const jsonData = $('#json-data');
        
        // Get the raw string values
        const regionsStr = jsonData.attr('data-regions');
        const sizesStr = jsonData.attr('data-sizes');
        
        // Debugging - check what we're receiving
        console.log("Regions string:", regionsStr);
        console.log("Sizes string:", sizesStr);
        
        // Parse the JSON
        const regions = JSON.parse(regionsStr);
        const sizes = JSON.parse(sizesStr);
        
        initializeUI(regions, sizes);
    } catch (error) {
        console.error("Error initializing UI:", error);
        // Fallback data
        initializeUI(
            ["North", "Kandy", "Kurunagela", "Southern", "Negombo", "East", "Colombo"],
            ["STEP LADDER", "MULTIPURPOSE LADDER"]
        );
    }
});

function initializeUI(regions, sizes) {
    // Populate dropdowns
    populateDropdown('#region', regions);
    populateDropdown('#size', sizes);
    
    // Set default dates (current month start to next month end)
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    $('#start_date').val(formatDate(startDate));
    $('#end_date').val(formatDate(endDate));
    
    // Initialize chart placeholder
    window.salesChart = null;
    
    // Hide loading and error messages initially
    $('.loading').hide();
    $('#errorMessage').hide();
    
    // Form submission handler
    $('#predictionForm').on('submit', function(e) {
        e.preventDefault();
        submitPredictionForm();
    });
}

function populateDropdown(selector, items) {
    const $select = $(selector);
    $select.empty().append('<option value="" selected disabled>Select...</option>');
    items.forEach(item => {
        $select.append($('<option>', {
            value: item,
            text: item
        }));
    });
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function submitPredictionForm() {
    // Reset UI
    $('.results-card').hide();
    $('#errorMessage').hide();
    $('.loading').show();
    
    // Get form data
    const formData = new FormData($('#predictionForm')[0]);
    
    // AJAX request
    $.ajax({
        url: 'http://127.0.0.1:5000/market_demand/predict',  // Changed to relative path
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            handlePredictionResponse(response);
        },
        error: function(xhr) {
            handlePredictionError(xhr);
        }
    });
}

function handlePredictionResponse(response) {
    $('.loading').hide();
    
    if (response.status === 'error') {
        $('#errorText').text(response.error);
        $('#errorMessage').show();
        return;
    }
    
    // Update metrics
    $('#totalSales').text(Math.round(response.total));
    $('#avgSales').text(Math.round(response.average));
    $('#maxSales').text(Math.round(response.max));
    $('#minSales').text(Math.round(response.min));
    
    // Create/update chart
    createSalesChart(response.dates, response.predictions);
    
    // Show results
    $('.results-card').show();
}

function handlePredictionError(xhr) {
    $('.loading').hide();
    const errorMsg = xhr.responseJSON && xhr.responseJSON.error 
        ? xhr.responseJSON.error 
        : 'An error occurred while generating the forecast. Please check your inputs and try again.';
    $('#errorText').text(errorMsg);
    $('#errorMessage').show();
}

function createSalesChart(dates, predictions) {
    // Destroy previous chart if exists
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    // Get granularity
    const granularity = $('#granularity').val();
    
    // Format dates based on granularity
    const formattedDates = dates.map(date => {
        const d = new Date(date);
        if (granularity === 'daily') {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (granularity === 'weekly') {
            return `Week ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
    });
    
    // Create canvas
    const canvas = $('<canvas>', {
        id: 'salesChart',
        width: '100%',
        height: '170px'
    });
    
    $('#chartContainer').empty().append(canvas);
    
    // Create chart
    const ctx = canvas[0].getContext('2d');
    window.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [{
                label: 'Predicted Sales (units)',
                data: predictions,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Sales: ${context.raw.toFixed(0)} units`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Units Sold'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: granularity.charAt(0).toUpperCase() + granularity.slice(1) + ' Period'
                    }
                }
            }
        }
    });
}