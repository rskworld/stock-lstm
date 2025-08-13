# Stock Price Prediction with LSTM

A web application that predicts stock prices using Long Short-Term Memory (LSTM) neural networks. This application allows users to train models on historical stock data and visualize predictions with interactive charts.

## Features

- Real-time stock data fetching using Yahoo Finance API
- Interactive charts with historical and predicted prices
- Responsive design that works on desktop and mobile
- Detailed stock information table
- Model training with customizable parameters

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git (optional, for cloning the repository)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rskworld/stock-lstm.git
   cd stock-lstm
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the Flask development server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## How to Use

1. **Train the Model**:
   - Enter a stock ticker symbol (e.g., AAPL, MSFT, GOOGL)
   - Adjust the time step and epochs if needed
   - Click "Train Model" and wait for training to complete

2. **Make Predictions**:
   - After training, enter the number of days to predict
   - Click "Predict" to see the forecast

3. **View Results**:
   - The chart will show historical prices and predictions
   - The table displays recent stock data
   - Prediction summary shows the expected price change

## Project Structure

```
stock-lstm/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md              # This file
├── static/
│   ├── css/
│   │   └── style.css     # Custom styles
│   ├── js/
│   │   └── main.js       # Frontend JavaScript
│   └── models/            # Saved models and scalers
└── templates/
    └── index.html        # Main HTML template
```

## Customization

- **Change Default Stock**: Modify the default ticker in `app.py` (look for `ticker = 'AAPL'`)
- **Adjust Model Parameters**: Modify the LSTM architecture in `app.py`
- **Update Styling**: Edit the CSS in `static/css/style.css`

## Troubleshooting

- **Installation Issues**: Make sure you have the correct Python version and all dependencies installed
- **Model Training Fails**: Check your internet connection and ensure the stock ticker is valid
- **Chart Not Loading**: Make sure JavaScript is enabled in your browser

## Credits

- **Created by**: [Molla Samser](https://rskworld.in)
- **Website**: [rskworld.in](https://rskworld.in)
- **Email**: help@rskworld.in
- **Phone**: +91 9330539277

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Yahoo Finance](https://finance.yahoo.com/) for providing stock market data
- [TensorFlow](https://www.tensorflow.org/) for the LSTM implementation
- [Chart.js](https://www.chartjs.org/) for interactive data visualization
- [Bootstrap](https://getbootstrap.com/) for responsive design components
