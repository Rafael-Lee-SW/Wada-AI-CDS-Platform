# utils.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import logging


# 다양한 인코딩을 도와주는 함수
def read_csv_with_encoding(file_path):
    """
    Reads a CSV file with appropriate encoding handling.
    Tries 'euc-kr' first, then 'utf-8' if the first attempt fails.

    Parameters:
    - file_path (str): Path to the CSV file.

    Returns:
    - pd.DataFrame: The loaded DataFrame.
    """
    try:
        df = pd.read_csv(file_path, encoding="euc-kr")
        logging.info(f"File '{file_path}' read successfully with EUC-KR encoding.")
        return df
    except UnicodeDecodeError as e:
        logging.warning(f"EUC-KR decoding failed: {e}. Trying UTF-8 decoding.")
        try:
            df = pd.read_csv(file_path, encoding="utf-8")
            logging.info(f"File '{file_path}' read successfully with UTF-8 encoding.")
            return df
        except UnicodeDecodeError as e2:
            logging.error(
                f"Failed to decode file '{file_path}' with both EUC-KR and UTF-8: {e2}"
            )
            raise e2


def load_and_preprocess_data(
    data,
    target_variable=None,
    feature_columns=None,
    task_type="classification",
    encode_categorical=True,
    fill_missing=True,
):
    if isinstance(data, str):
        df = read_csv_with_encoding(data)
    else:
        df = data.copy()

    # Preserve the original indices
    original_indices = df.index.copy()

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
            y_encoded = le.fit_transform(y)  # y_encoded is a NumPy array
            y = pd.Series(
                y_encoded, index=original_indices, name=target_variable
            )  # Convert back to Series
    else:
        if y is not None:
            y = pd.Series(y, index=original_indices, name=target_variable)

    # Restore original indices
    X.index = original_indices

    if y is not None:
        y.index = original_indices

    return X, y


def split_data(
    X,
    y,
    ids=None,
    test_size=0.2,
    random_state=42,
    return_ids=False,
    task_type="classification",
):
    if task_type == "classification":
        stratify_param = y
    else:
        stratify_param = None

    if ids is not None:
        # Convert ids to a Series if it's not already
        if not isinstance(ids, pd.Series):
            ids = pd.Series(ids, index=X.index)

        # Align ids with X and y
        ids = ids.loc[X.index]

        X_train, X_test, y_train, y_test, id_train, id_test = train_test_split(
            X,
            y,
            ids,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify_param,
        )
        if return_ids:
            return X_train, X_test, y_train, y_test, id_train, id_test
        else:
            return X_train, X_test, y_train, y_test
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify_param,
        )
        return X_train, X_test, y_train, y_test


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
