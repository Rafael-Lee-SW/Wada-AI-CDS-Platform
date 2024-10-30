# utils.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

def load_and_preprocess_data(
    data,
    target_variable=None,
    feature_columns=None,
    task_type="classification",
    encode_categorical=True,
    fill_missing=True,
):
    if isinstance(data, str):
        df = pd.read_csv(data)
    else:
        df = data.copy()

    # Handle date columns
    date_cols = [col for col in df.columns if "date" in col.lower()]
    for date_col in date_cols:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        derived_col = f"{date_col}_DaysSince"
        df[derived_col] = (pd.to_datetime("today") - df[date_col]).dt.days
        df = df.drop(date_col, axis=1)
        if feature_columns:
            if date_col in feature_columns:
                feature_columns.remove(date_col)
                feature_columns.append(derived_col)

    # Identify categorical columns
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    if target_variable in categorical_cols:
        categorical_cols.remove(target_variable)

    if feature_columns is None and target_variable is not None:
        feature_columns = df.columns.drop(target_variable).tolist()
    elif feature_columns is None:
        feature_columns = df.columns.tolist()

    # Select features and target
    X = df[feature_columns].copy()
    y = df[target_variable].copy() if target_variable else None

    # Handle missing values
    if fill_missing:
        num_cols = X.select_dtypes(include=["int64", "float64"]).columns
        X[num_cols] = X[num_cols].fillna(X[num_cols].median())
        cat_cols = X.select_dtypes(include=["object", "category"]).columns
        for col in cat_cols:
            X[col] = X[col].fillna(X[col].mode()[0])

    # Encode categorical variables
    if encode_categorical:
        X = pd.get_dummies(X, drop_first=True)
        if y is not None and y.dtype == "object":
            le = LabelEncoder()
            y = le.fit_transform(y)

    return X, y

def split_data(X, y, test_size=0.2, random_state=42):
    return train_test_split(X, y, test_size=test_size, random_state=random_state)

def generate_binary_condition(df, name_of_col, conditions):
    if not conditions:
        raise ValueError("No conditions provided for binary target generation.")

    binary_series = pd.Series([True] * len(df), index=df.index)

    for condition in conditions:
        col = condition["column"]
        op = condition["operator"]
        val = condition["value"]

        if col not in df.columns:
            raise KeyError(f"Column '{col}' not found in the dataset.")

        if op == ">":
            binary_series &= df[col] > val
        elif op == "<":
            binary_series &= df[col] < val
        elif op == "==":
            binary_series &= df[col] == val
        elif op == ">=":
            binary_series &= df[col] >= val
        elif op == "<=":
            binary_series &= df[col] <= val
        elif op == "!=":
            binary_series &= df[col] != val
        else:
            raise ValueError(f"Unsupported operator '{op}' in conditions.")

    df[name_of_col] = binary_series.astype(int)
    return df
