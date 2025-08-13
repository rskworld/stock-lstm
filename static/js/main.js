document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const stockForm = document.getElementById('stockForm');
    const predictionForm = document.getElementById('predictionForm');
    const trainBtn = document.getElementById('trainBtn');
    const predictBtn = document.getElementById('predictBtn');
    const stockChartCtx = document.getElementById('stockChart').getContext('2d');
    
    // Chart instance
    let stockChart = null;
    let historicalData = [];
    let predictionData = [];
    
    // Initialize the app
    init();
    
    // Event Listeners
    stockForm.addEventListener('submit', handleTrainModel);
    predictionForm.addEventListener('submit', handlePrediction);
    
    // Initialize the app
    function init() {
        // Initialize chart with empty data
        initChart();
        // Load default stock data
        loadStockData('AAPL', '1y');
    }
    
    // Initialize Chart.js
    function initChart() {
        stockChart = new Chart(stockChartCtx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Historical Prices',
                        data: [],
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        borderWidth: 2,
                        pointRadius: 2,
                        fill: true
                    },
                    {
                        label: 'Predicted Prices',
                        data: [],
                        borderColor: '#dc3545',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 2,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Price (USD)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.raw.y.toFixed(2)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Stock Price History & Prediction'
                    }
                }
            }
        });
    }
    
    // Handle model training
    async function handleTrainModel(e) {
        e.preventDefault();
        
        const ticker = document.getElementById('ticker').value.toUpperCase();
        const timeStep = document.getElementById('timeStep').value;
        const epochs = document.getElementById('epochs').value;
        
        // Show loading state
        const spinner = trainBtn.querySelector('.spinner-border');
        trainBtn.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            // Train the model
            const response = await fetch('/train', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ticker: ticker,
                    time_step: timeStep,
                    epochs: epochs
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Model trained successfully!', 'success');
                // Enable prediction button
                predictBtn.disabled = false;
                // Reload stock data
                loadStockData(ticker, '1y');
            } else {
                throw new Error(result.message || 'Failed to train model');
            }
        } catch (error) {
            console.error('Error training model:', error);
            showAlert(`Error: ${error.message}`, 'danger');
        } finally {
            // Reset button state
            trainBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    }
    
    // Handle prediction
    async function handlePrediction(e) {
        e.preventDefault();
        
        const days = document.getElementById('predictionDays').value;
        const spinner = predictBtn.querySelector('.spinner-border');
        predictBtn.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            // Get predictions
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    days: days
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                predictionData = result.predictions.prices.map((price, index) => ({
                    x: new Date(result.predictions.dates[index]),
                    y: price
                }));
                
                // Update chart with predictions
                updateChart();
                
                // Update prediction summary
                if (historicalData.length > 0 && predictionData.length > 0) {
                    const currentPrice = historicalData[historicalData.length - 1].y;
                    const predictedPrice = predictionData[0].y;
                    const change = ((predictedPrice - currentPrice) / currentPrice * 100).toFixed(2);
                    
                    document.getElementById('currentPrice').textContent = `$${currentPrice.toFixed(2)}`;
                    document.getElementById('predictedPrice').textContent = `$${predictedPrice.toFixed(2)}`;
                    
                    const changeElement = document.getElementById('priceChange');
                    changeElement.textContent = `${change}%`;
                    changeElement.className = `fw-bold ${change >= 0 ? 'text-success' : 'text-danger'}`;
                }
                
                showAlert('Prediction completed!', 'success');
            } else {
                throw new Error(result.error || 'Failed to get predictions');
            }
        } catch (error) {
            console.error('Error getting predictions:', error);
            showAlert(`Error: ${error.message}`, 'danger');
        } finally {
            predictBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    }
    
    // Load stock data
    async function loadStockData(ticker, period) {
        try {
            const response = await fetch(`/history?ticker=${ticker}&period=${period}`);
            const result = await response.json();
            
            if (result.success) {
                historicalData = result.data.map(item => ({
                    x: new Date(item.date),
                    y: parseFloat(item.close)
                }));
                
                // Update chart with historical data
                updateChart();
                
                // Update stock table
                updateStockTable(result.data);
            } else {
                throw new Error('Failed to load stock data');
            }
        } catch (error) {
            console.error('Error loading stock data:', error);
            showAlert(`Error loading stock data: ${error.message}`, 'danger');
        }
    }
    
    // Update chart with current data
    function updateChart() {
        if (!stockChart) return;
        
        stockChart.data.datasets[0].data = historicalData;
        stockChart.data.datasets[1].data = predictionData;
        
        // Update chart title with current stock
        const ticker = document.getElementById('ticker').value.toUpperCase();
        stockChart.options.plugins.title.text = `${ticker} Stock Price History & Prediction`;
        
        stockChart.update();
    }
    
    // Update stock table
    function updateStockTable(data) {
        const tbody = document.getElementById('stockTableBody');
        tbody.innerHTML = '';
        
        // Show only the last 10 days by default
        const recentData = data.slice(-10).reverse();
        
        recentData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>$${parseFloat(item.open).toFixed(2)}</td>
                <td>$${parseFloat(item.high).toFixed(2)}</td>
                <td>$${parseFloat(item.low).toFixed(2)}</td>
                <td>$${parseFloat(item.close).toFixed(2)}</td>
                <td>${parseInt(item.volume).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Show alert message
    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add to the page
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
});
