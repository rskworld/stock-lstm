from flask import Flask, render_template, request, jsonify
import os
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
import json

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/models'

# Ensure model directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

MODEL_PATH = os.path.join(app.config['UPLOAD_FOLDER'], 'lstm_model.h5')
SCALER_PATH = os.path.join(app.config['UPLOAD_FOLDER'], 'scaler.pkl')

# Global variables
model = None
scaler = MinMaxScaler(feature_range=(0, 1))

def download_stock_data(ticker, period='5y'):
    """Download stock data using yfinance"""
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        return df
    except Exception as e:
        print(f"Error downloading data: {e}")
        return None

def prepare_data(data, time_step=60):
    """Prepare data for LSTM model"""
    df = data.filter(['Close']).copy()
    scaled_data = scaler.fit_transform(df['Close'].values.reshape(-1, 1))
    
    x_train, y_train = [], []
    for i in range(time_step, len(scaled_data)):
        x_train.append(scaled_data[i-time_step:i, 0])
        y_train.append(scaled_data[i, 0])
    
    return np.array(x_train), np.array(y_train), scaler

def create_model(time_step):
    """Create and compile LSTM model"""
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(time_step, 1)),
        Dropout(0.2),
        LSTM(50, return_sequences=False),
        Dropout(0.2),
        Dense(25),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def train_model(ticker='AAPL', time_step=60, epochs=50):
    """Train the LSTM model"""
    global model, scaler
    
    # Download data
    df = download_stock_data(ticker)
    if df is None or df.empty:
        return False, "Failed to download stock data"
    
    # Prepare data
    x_train, y_train, scaler = prepare_data(df, time_step)
    x_train = np.reshape(x_train, (x_train.shape[0], x_train.shape[1], 1))
    
    # Create and train model
    model = create_model(time_step)
    model.fit(x_train, y_train, batch_size=64, epochs=epochs, validation_split=0.2, verbose=1)
    
    # Save model and scaler
    model.save(MODEL_PATH)
    import joblib
    joblib.dump(scaler, SCALER_PATH)
    
    return True, "Model trained successfully"

def predict_next_days(days=30):
    """Predict stock prices for the next 'days' days"""
    global model, scaler
    
    if model is None or not os.path.exists(MODEL_PATH):
        return None, "Model not found. Please train the model first."
    
    try:
        # Load model and scaler if not loaded
        if model is None:
            model = load_model(MODEL_PATH)
            import joblib
            scaler = joblib.load(SCALER_PATH)
        
        # Get recent data for prediction
        ticker = 'AAPL'  # Default ticker
        df = download_stock_data(ticker, period='60d')
        if df is None or df.empty:
            return None, "Failed to download recent stock data"
        
        # Prepare data for prediction
        last_60_days = df['Close'].values[-60:]
        last_60_days_scaled = scaler.transform(last_60_days.reshape(-1, 1))
        
        # Make predictions
        predictions = []
        x_test = last_60_days_scaled.reshape(1, -1, 1)
        
        for _ in range(days):
            pred = model.predict(x_test, verbose=0)
            predictions.append(pred[0][0])
            x_test = np.append(x_test[0][1:], pred).reshape(1, -1, 1)
        
        # Inverse transform predictions
        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
        
        # Create dates for predictions
        last_date = df.index[-1]
        prediction_dates = [last_date + timedelta(days=i) for i in range(1, days+1)]
        
        # Prepare response
        result = {
            'dates': [d.strftime('%Y-%m-%d') for d in prediction_dates],
            'prices': [float(p[0]) for p in predictions]
        }
        
        return result, None
    
    except Exception as e:
        return None, f"Error making predictions: {str(e)}"

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/train', methods=['POST'])
def train():
    """API endpoint to train the model"""
    data = request.get_json()
    ticker = data.get('ticker', 'AAPL')
    time_step = int(data.get('time_step', 60))
    epochs = int(data.get('epochs', 50))
    
    success, message = train_model(ticker, time_step, epochs)
    return jsonify({'success': success, 'message': message})

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint to get predictions"""
    data = request.get_json()
    days = int(data.get('days', 30))
    
    predictions, error = predict_next_days(days)
    if error:
        return jsonify({'success': False, 'error': error})
    
    return jsonify({'success': True, 'predictions': predictions})

@app.route('/history')
def get_history():
    """Get historical stock data"""
    ticker = request.args.get('ticker', 'AAPL')
    period = request.args.get('period', '1y')
    
    df = download_stock_data(ticker, period)
    if df is None or df.empty:
        return jsonify({'success': False, 'error': 'Failed to fetch historical data'})
    
    history = [{
        'date': date.strftime('%Y-%m-%d'),
        'open': row['Open'],
        'high': row['High'],
        'low': row['Low'],
        'close': row['Close'],
        'volume': row['Volume']
    } for date, row in df.iterrows()]
    
    return jsonify({'success': True, 'data': history})

if __name__ == '__main__':
    # Create templates and static directories if they don't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('static/models', exist_ok=True)
    
    # Run the app
    app.run(debug=True)
