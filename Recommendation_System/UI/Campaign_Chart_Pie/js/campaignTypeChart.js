document.addEventListener('DOMContentLoaded', function() {
    fetch('data/dataset.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Count campaign types
            const campaignCounts = {
                'Mega': 0,
                'General': 0,
                'Influencer': 0,
                'No Campaign': 0
            };

            data.forEach(item => {
                const campaignType = item['Campaign Type'];
                if (campaignType === 'Mega') {
                    campaignCounts['Mega']++;
                } else if (campaignType === 'General') {
                    campaignCounts['General']++;
                } else if (campaignType === 'Influencer') {
                    campaignCounts['Influencer']++;
                } else {
                    campaignCounts['No Campaign']++;
                }
            });

            // Prepare data for chart
            const labels = Object.keys(campaignCounts);
            const counts = Object.values(campaignCounts);
            const backgroundColors = [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)'
            ];
            const borderColors = [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ];

            // Create the pie chart
            const ctx = document.getElementById('campaignTypeChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribution of Campaign Types',
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const container = document.getElementById('campaignTypeChart').parentElement;
            container.innerHTML = `
                <div class="error">
                    <h3>Campaign Type Chart Loading Failed</h3>
                    <p>${error.message}</p>
                    <p>Check console for details</p>
                </div>
            `;
        });
});