# models/neural_network.py

from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt
from utils import load_and_preprocess_data, split_data
import pandas as pd
import numpy as np

def neural_network_regression(
    file_path=None,
    target_variable=None,
    feature_columns=None,
    epochs=50,
    batch_size=10,
    **kwargs,
):
    """
    Neural Network Regression model.

    Parameters:
    - file_path (str): Path to the CSV dataset file.
    - target_variable (str): Name of the target variable.
    - feature_columns (list): List of feature column names.
    - epochs (int): Number of training epochs.
    - batch_size (int): Batch size for training.

    Returns:
    - dict: Contains the model, history, loss, and predictions.
    """
    # Load and preprocess data
    X, y = load_and_preprocess_data(
        file_path,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="regression",
    )

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Optionally, scale the target variable
    scaler_y = StandardScaler()
    y_train_scaled = scaler_y.fit_transform(y_train.values.reshape(-1, 1))
    y_test_scaled = scaler_y.transform(y_test.values.reshape(-1, 1))

    # Build the model
    model = Sequential()
    model.add(Dense(64, activation="relu", input_dim=X_train_scaled.shape[1]))
    model.add(Dense(32, activation="relu"))
    model.add(Dense(1, activation="linear"))  # Output layer for regression

    # Compile the model
    model.compile(optimizer=Adam(), loss="mean_squared_error")

    # Train the model
    history = model.fit(
        X_train_scaled,
        y_train_scaled,
        epochs=epochs,
        batch_size=batch_size,
        validation_data=(X_test_scaled, y_test_scaled),
        verbose=0,
    )

    # Evaluate the model
    loss = model.evaluate(X_test_scaled, y_test_scaled, verbose=0)

    # Make predictions and inverse transform
    y_pred_scaled = model.predict(X_test_scaled).flatten()
    y_pred = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()

    return {
        "model": model,
        "history": history.history,  # Convert history object to dict
        "loss": loss,
        "y_test": y_test,
        "y_pred": y_pred,
    }
