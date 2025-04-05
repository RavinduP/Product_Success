document.addEventListener('DOMContentLoaded', function() {
    fetch('data/dataset.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Process data - group by month across years
            const monthlyData = {};
            const campaignData = {}; // To store campaign info by month
            
            data.forEach(item => {
                const month = item.Month;
                const year = item.Year;
                const campaignType = item['Campaign Type'];
                
                // Initialize month data if not exists
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        month: month,
                        physicalRevenues: [],
                        onlineRevenues: [],
                        totalRevenues: [],
                        years: []
                    };
                }
                
                // Initialize campaign data if not exists
                if (!campaignData[month]) {
                    campaignData[month] = {
                        types: new Set(),
                        years: {}
                    };
                }
                
                // Record campaign type if it's an actual campaign
                if (campaignType !== 'No' && campaignType !== 'No Campaign') {
                    campaignData[month].types.add(campaignType);
                    if (!campaignData[month].years[year]) {
                        campaignData[month].years[year] = new Set();
                    }
                    campaignData[month].years[year].add(campaignType);
                }
                
                // Revenue data
                const physical = parseFloat(item['Sales Revenue - Physical'] || 0);
                const online = parseFloat(item['Sales Revenue - Online'] || 0);
                const total = physical + online;
                
                monthlyData[month].physicalRevenues.push(physical);
                monthlyData[month].onlineRevenues.push(online);
                monthlyData[month].totalRevenues.push(total);
                monthlyData[month].years.push(year);
            });
            
            // Calculate averages for each month
            const months = Object.keys(monthlyData).sort((a, b) => {
                const monthOrder = ["January", "February", "March", "April", "May", "June", 
                                  "July", "August", "September", "October", "November", "December"];
                return monthOrder.indexOf(a) - monthOrder.indexOf(b);
            });
            
            const avgPhysical = months.map(month => {
                const sum = monthlyData[month].physicalRevenues.reduce((a, b) => a + b, 0);
                return sum / monthlyData[month].physicalRevenues.length;
            });
            
            const avgOnline = months.map(month => {
                const sum = monthlyData[month].onlineRevenues.reduce((a, b) => a + b, 0);
                return sum / monthlyData[month].onlineRevenues.length;
            });
            
            const avgTotal = months.map(month => {
                const sum = monthlyData[month].totalRevenues.reduce((a, b) => a + b, 0);
                return sum / monthlyData[month].totalRevenues.length;
            });
            
            // Prepare campaign annotations
            const campaignAnnotations = months.map(month => {
                const hasCampaign = campaignData[month] && campaignData[month].types.size > 0;
                if (!hasCampaign) return null;
                
                // Get all unique campaign types for this month
                const campaignTypes = Array.from(campaignData[month].types).join(', ');
                
                // Get years when campaigns occurred
                const campaignYears = Object.keys(campaignData[month].years)
                    .map(year => `${year}: ${Array.from(campaignData[month].years[year]).join(', ')}`)
                    .join('\n');
                
                return {
                    type: 'line',
                    mode: 'vertical',
                    scaleID: 'x',
                    value: months.indexOf(month),
                    borderColor: 'rgba(255, 159, 64, 0.7)',
                    borderWidth: 2,
                    borderDash: [6, 6],
                    label: {
                        content: `Campaign: ${campaignTypes}`,
                        enabled: true,
                        position: 'top'
                    }
                };
            }).filter(annotation => annotation !== null);
            
            // Create the chart
            const ctx = document.getElementById('seasonalTrendChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Average Physical Revenue',
                            data: avgPhysical,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: false
                        },
                        {
                            label: 'Average Online Revenue',
                            data: avgOnline,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: false
                        },
                        {
                            label: 'Average Total Revenue',
                            data: avgTotal,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 3,
                            tension: 0.3,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Seasonal Revenue Trends by Month with Campaign Indicators',
                            font: { size: 16 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    label += ': Rs.' + context.raw.toLocaleString();
                                    return label;
                                },
                                afterLabel: function(context) {
                                    const month = months[context.dataIndex];
                                    if (campaignData[month] && campaignData[month].types.size > 0) {
                                        const campaignTypes = Array.from(campaignData[month].types).join(', ');
                                        const campaignYears = Object.keys(campaignData[month].years)
                                            .map(year => `${year}: ${Array.from(campaignData[month].years[year]).join(', ')}`)
                                            .join('\n');
                                        return [
                                            `Campaign Types: ${campaignTypes}`,
                                            `Campaign Years:\n${campaignYears}`
                                        ];
                                    }
                                    return 'No campaigns this month';
                                }
                            }
                        },
                        legend: {
                            position: 'top',
                        },
                        annotation: {
                            annotations: campaignAnnotations
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Month' }
                        },
                        y: {
                            title: { display: true, text: 'Revenue (Rs.)' },
                            ticks: { 
                                callback: value => 'Rs.' + value.toLocaleString(),
                                min: 0
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const container = document.getElementById('seasonalTrendChart').parentElement;
            container.innerHTML = `
                <div class="error">
                    <h3>Seasonal Trend Chart Loading Failed</h3>
                    <p>${error.message}</p>
                    <p>Check console for details</p>
                </div>
            `;
        });
});