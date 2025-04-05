document.addEventListener('DOMContentLoaded', function() {
    fetch('data/dataset.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Process data - filter only campaign months
            const campaignMonths = data
                .filter(item => 
                    item['Campaign Type'] !== 'No Campaign' && 
                    item['Campaign Type'] !== 'No' &&
                    !isNaN(parseFloat(item['Ad Budget'] || 0))
                )
                .map(item => ({
                    ...item,
                    monthYear: `${item.Month.substring(0,3)} ${item.Year}`,
                    physicalRevenue: parseFloat(item['Sales Revenue - Physical'] || 0),
                    onlineRevenue: parseFloat(item['Sales Revenue - Online'] || 0),
                    totalRevenue: (parseFloat(item['Sales Revenue - Physical'] || 0) + 
                                 parseFloat(item['Sales Revenue - Online'] || 0)),
                    budget: parseFloat(item['Ad Budget'] || 0) * 100000,
                    roi: ((parseFloat(item['Sales Revenue - Physical'] || 0) + 
                         parseFloat(item['Sales Revenue - Online'] || 0)) / 
                         (parseFloat(item['Ad Budget'] || 1)))
                })
            );

            if (campaignMonths.length === 0) {
                throw new Error('No campaign data found - check your filters');
            }

            const ctx = document.getElementById('budgetRevenueChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: campaignMonths.map(d => d.monthYear),
                    datasets: [
                        {
                            label: 'Ad Budget (Rs.)',
                            data: campaignMonths.map(d => d.budget),
                            backgroundColor: 'rgba(54, 162, 235, 0.7)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Revenue Generated (Rs.)',
                            data: campaignMonths.map(d => d.totalRevenue),
                            backgroundColor: 'rgba(255, 80, 202, 0.83)',
                            borderColor: 'rgba(255, 80, 202, 1)',
                            borderWidth: 1,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Campaign Budget vs Revenue by Month',
                            font: { size: 16 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (context.datasetIndex === 0) {
                                        label += ': Rs.' + (context.raw/100000).toLocaleString() + ' Lakhs';
                                    } else {
                                        label += ': Rs.' + context.raw.toLocaleString();
                                        const roi = campaignMonths[context.dataIndex].roi;
                                        label += ` (ROI: ${(roi*100).toFixed(0)}%)`;
                                    }
                                    return label;
                                },
                                afterLabel: function(context) {
                                    const item = campaignMonths[context.dataIndex];
                                    return [
                                        `Campaign Type: ${item['Campaign Type']}`,
                                        `Physical Revenue: Rs.${item.physicalRevenue.toLocaleString()}`,
                                        `Online Revenue: Rs.${item.onlineRevenue.toLocaleString()}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Month' }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Ad Budget (Rs. Lakhs)' },
                            ticks: { 
                                callback: value => `Rs.${(value/100000).toLocaleString()}`,
                                min: 0
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: true, text: 'Revenue (Rs.)' },
                            ticks: { 
                                callback: value => `Rs.${value.toLocaleString()}`,
                                min: 0
                            },
                            grid: { drawOnChartArea: false }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const container = document.getElementById('budgetRevenueChart').parentElement;
            container.innerHTML = `
                <div class="error">
                    <h3>Chart Loading Failed</h3>
                    <p>${error.message}</p>
                    <p>Check console for details</p>
                </div>
            `;
        });
});