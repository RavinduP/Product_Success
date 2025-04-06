document.addEventListener('DOMContentLoaded', function() {
    // Typing animation for h1
    const heroTitle = document.querySelector('.hero-content h1');
    const originalText = heroTitle.textContent;
    heroTitle.innerHTML = `<span class="typing-animation">${originalText}</span>`;
    
    // Add delayed-show class to h2 and p
    document.querySelector('.hero-content h2').classList.add('delayed-show');
    document.querySelector('.hero-content p').classList.add('delayed-show');
    
    // Initialize all charts
    initProductionChart();
    initDefectsChart();
    initSentimentChart();
    initCampaignChart();
    
    // Initialize chart navigation
    initChartNavigation();
    
    // Animate stats
    animateStats();
});

// Add this function to handle chart navigation
function initChartNavigation() {
    const container = document.getElementById('chartsContainer');
    const prevBtn = document.getElementById('prevChart');
    const nextBtn = document.getElementById('nextChart');
    const slides = document.querySelectorAll('.chart-slide');
    let currentSlide = 0;
    
    // Add Font Awesome for icons (if not already loaded)
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(faLink);
    }
    
    function updateButtons() {
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === slides.length - 1;
    }
    
    function goToSlide(index) {
        currentSlide = index;
        const scrollAmount = container.clientWidth * currentSlide;
        container.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
        updateButtons();
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentSlide < slides.length - 1) {
            goToSlide(currentSlide + 1);
        }
    });
    
    // Handle swipe on touch devices
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50 && currentSlide < slides.length - 1) {
            goToSlide(currentSlide + 1); // Swipe left
        }
        if (touchEndX > touchStartX + 50 && currentSlide > 0) {
            goToSlide(currentSlide - 1); // Swipe right
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        goToSlide(currentSlide);
    });
    
    updateButtons();
}

// Animate statistics numbers
function animateStats() {
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
        const target = parseInt(stat.textContent.replace('+', ''));
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                current = target;
                if (stat.textContent.includes('+')) {
                    stat.textContent = target + '+';
                } else {
                    stat.textContent = target;
                }
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 16);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all charts
    initProductionChart();
    initDefectsChart();
    initSentimentChart();
    initCampaignChart();
    
    // Sample function for fetching data from backend
    fetchProductionData();
});

// Example API fetch function
async function fetchProductionData() {
    try {
        const response = await fetch('/api/production');
        const data = await response.json();
        
        // Update charts with real data
        updateProductionChart(data);
    } catch (error) {
        console.error('Error fetching production data:', error);
    }
}

function initProductionChart() {
    const ctx = document.getElementById('productionChart').getContext('2d');
    window.productionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Production Output (Mt)',
                data: [1200, 1350, 1420, 1580, 1650, 1720, 1850],
                backgroundColor: 'rgba(0, 95, 174, 0.1)',
                borderColor: 'rgba(0, 95, 174, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(0, 95, 174, 1)',
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: 'Target (Mt)',
                data: [1300, 1400, 1450, 1550, 1650, 1750, 1850],
                borderColor: 'rgba(231, 76, 60, 0.7)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Production vs Target',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Metric Tons (Mt)'
                    },
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initDefectsChart() {
    const ctx = document.getElementById('defectsChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Doors (12%)', 'Windows (19%)', 'Ladders (8%)', 'Frames (15%)', 'Other (46%)'],
            datasets: [{
                data: [12, 19, 8, 15, 46],
                backgroundColor: [
                    'rgba(0, 95, 174, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(149, 165, 166, 0.8)'
                ],
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                title: {
                    display: true,
                    text: 'Defect Distribution by Product Line',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        boxWidth: 12,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

function initSentimentChart() {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'],
            datasets: [{
                label: 'Positive',
                data: [72, 68, 75, 80, 82],
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }, {
                label: 'Neutral',
                data: [18, 20, 15, 12, 10],
                backgroundColor: 'rgba(241, 196, 15, 0.8)',
                borderColor: 'rgba(241, 196, 15, 1)',
                borderWidth: 1
            }, {
                label: 'Negative',
                data: [10, 12, 10, 8, 8],
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Customer Sentiment Analysis',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawBorder: false
                    }
                }
            }
        }
    });
}

function initCampaignChart() {
    const ctx = document.getElementById('campaignChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Social Media', 'Email', 'TV Ads', 'Print Media', 'Influencers', 'Trade Shows'],
            datasets: [{
                label: 'Campaign Effectiveness',
                data: [85, 65, 70, 50, 75, 80],
                backgroundColor: 'rgba(0, 95, 174, 0.2)',
                borderColor: 'rgba(0, 95, 174, 1)',
                pointBackgroundColor: 'rgba(0, 95, 174, 1)',
                pointBorderColor: '#fff',
                pointHoverRadius: 5,
                pointRadius: 3,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Marketing Campaign Performance',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

// Example function to update chart with real data
function updateProductionChart(data) {
    window.productionChart.data.labels = data.labels;
    window.productionChart.data.datasets[0].data = data.values;
    window.productionChart.update();
}