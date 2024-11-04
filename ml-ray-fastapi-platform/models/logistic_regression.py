# models/logistic_regression.py

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from utils import (
    load_and_preprocess_data,
    split_data,
    generate_binary_condition,
)


def logistic_regression_binary(
    file_path=None,
    target_variable=None,
    feature_columns=None,
    binary_conditions=None,
    plot_filename="binary_logistic_regression_plot.png",
    **kwargs,
):
    """
    Train and evaluate a Logistic Regression model on a binary classification task.
    Generates a 2D scatter plot with the decision boundary.

    Parameters:
    - file_path (str): Path to the CSV file.
    - target_variable (str): Name of the target variable column.
    - feature_columns (list): List of feature column names.
    - binary_conditions (list of dict): Conditions to generate the binary target variable.
    - plot_filename (str): Filename to save the plot.
    - **kwargs: Additional keyword arguments.

    Returns:
    - dict: Contains model, accuracy, classification report, plot filename, etc.
    """
    if not target_variable:
        raise ValueError("Target variable must be specified for binary classification.")

    # Load the dataset
    df = pd.read_csv(file_path)

    # Generate binary target variable based on conditions
    if target_variable not in df.columns:
        if not binary_conditions:
            raise ValueError(
                f"Target variable '{target_variable}' not found in the dataset and no binary conditions provided."
            )
        try:
            df = generate_binary_condition(df, target_variable, binary_conditions)
            print(f"Generated target variable '{target_variable}'.")
        except Exception as e:
            print(f"Error generating target variable '{target_variable}': {e}")
            raise e

    # Use load_and_preprocess_data to handle missing values and preprocessing
    X, y = load_and_preprocess_data(
        df,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="classification",
    )

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Initialize the model
    model = LogisticRegression(max_iter=2000)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)

    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    confusion = confusion_matrix(y_test, y_pred).tolist()

    # Perform PCA for visualization
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    pca = PCA(n_components=2)
    X_vis = pca.fit_transform(X_scaled)

    # Create a mesh to plot decision boundary
    x_min, x_max = X_vis[:, 0].min() - 1, X_vis[:, 0].max() + 1
    y_min, y_max = X_vis[:, 1].min() - 1, X_vis[:, 1].max() + 1
    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, 200),
        np.linspace(y_min, y_max, 200)
    )

    # Predict probabilities for the mesh grid
    mesh_points = np.c_[xx.ravel(), yy.ravel()]
    Z = model.predict_proba(pca.inverse_transform(mesh_points))[:, 1]
    Z = Z.reshape(xx.shape)

    # Plotting
    plt.figure(figsize=(10, 6))
    plt.contourf(xx, yy, Z, alpha=0.8, levels=np.linspace(0, 1, 10), cmap=plt.cm.RdBu)
    plt.scatter(X_vis[:, 0], X_vis[:, 1], c=y, edgecolors='k', cmap=plt.cm.RdBu, alpha=0.6)
    plt.title("Binary Logistic Regression with Decision Boundary")
    plt.xlabel("Principal Component 1")
    plt.ylabel("Principal Component 2")
    plt.colorbar()
    plt.tight_layout()

    # Save the plot
    plot_path = os.path.join("plots", plot_filename)
    os.makedirs("plots", exist_ok=True)
    plt.savefig(plot_path)
    plt.close()

    return {
        "model": model,
        "accuracy": accuracy,
        "report": report,
        "confusion_matrix": confusion,
        "plot_filename": plot_path,
        "y_test": y_test.tolist(),
        "y_pred": y_pred.tolist(),
    }


def logistic_regression_multinomial(
    file_path=None,
    target_variable=None,
    feature_columns=None,
    plot_filename="multinomial_logistic_regression_plot.png",
    **kwargs,
):
    """
    Train and evaluate a Multinomial Logistic Regression model.
    Generates a 2D scatter plot with decision boundaries.

    Parameters:
    - file_path (str): Path to the CSV file.
    - target_variable (str): Name of the target variable column.
    - feature_columns (list): List of feature column names.
    - plot_filename (str): Filename to save the plot.
    - **kwargs: Additional keyword arguments.

    Returns:
    - dict: Contains model, accuracy, classification report, plot filename, etc.
    """
    if not target_variable:
        raise ValueError("Target variable must be specified for multinomial classification.")

    # Load and preprocess data
    X, y = load_and_preprocess_data(
        file_path,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="classification",
    )

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Initialize the model with multinomial option
    model = LogisticRegression(multi_class='multinomial', solver='lbfgs', max_iter=2000)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)

    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    confusion = confusion_matrix(y_test, y_pred).tolist()

    # Perform PCA for visualization
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    pca = PCA(n_components=2)
    X_vis = pca.fit_transform(X_scaled)

    # Create a mesh to plot decision boundaries
    x_min, x_max = X_vis[:, 0].min() - 1, X_vis[:, 0].max() + 1
    y_min, y_max = X_vis[:, 1].min() - 1, X_vis[:, 1].max() + 1
    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, 200),
        np.linspace(y_min, y_max, 200)
    )

    # Predict classes for the mesh grid
    mesh_points = np.c_[xx.ravel(), yy.ravel()]
    Z = model.predict(pca.inverse_transform(mesh_points))
    Z = Z.reshape(xx.shape)

    # Plotting
    plt.figure(figsize=(10, 6))
    plt.contourf(xx, yy, Z, alpha=0.8, cmap=plt.cm.tab10)
    plt.scatter(X_vis[:, 0], X_vis[:, 1], c=y, edgecolors='k', cmap=plt.cm.tab10)
    plt.title("Multinomial Logistic Regression with Decision Boundaries")
    plt.xlabel("Principal Component 1")
    plt.ylabel("Principal Component 2")
    plt.colorbar()
    plt.tight_layout()

    # Save the plot
    plot_path = os.path.join("plots", plot_filename)
    os.makedirs("plots", exist_ok=True)
    plt.savefig(plot_path)
    plt.close()

    return {
        "model": model,
        "accuracy": accuracy,
        "report": report,
        "confusion_matrix": confusion,
        "plot_filename": plot_path,
        "y_test": y_test.tolist(),
        "y_pred": y_pred.tolist(),
    }
