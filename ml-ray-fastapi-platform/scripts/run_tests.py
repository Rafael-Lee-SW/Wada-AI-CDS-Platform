# scripts/run_tests.py

import requests
import yaml
import logging
from datetime import datetime
import os
import time
import json

test_config_now = 'test_config_soowan_1.yaml'

def setup_logging(base_log_dir, trial_num):
    """
    Sets up logging for a specific test trial.
    
    Parameters:
    - base_log_dir (str): Base directory for logs.
    - trial_num (int): Current trial number.
    
    Returns:
    - logger (logging.Logger): Configured logger.
    """
    # Define log directory for the current date
    current_date = datetime.now().strftime("%Y-%m-%d")
    date_log_dir = os.path.join(base_log_dir, current_date)
    os.makedirs(date_log_dir, exist_ok=True)
    
    # Define log file name with trial number and timestamp
    timestamp = datetime.now().strftime("%H%M%S")
    log_filename = f"TestTrial{trial_num}_{timestamp}.log"
    log_file_path = os.path.join(date_log_dir, log_filename)
    
    # Create a dedicated logger
    logger = logging.getLogger(f"TestTrial{trial_num}")
    logger.setLevel(logging.INFO)
    
    # Create file handler
    file_handler = logging.FileHandler(log_file_path)
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('%(levelname)s - %(message)s')
    console_handler.setFormatter(console_formatter)
    
    # Add handlers to the logger
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger, date_log_dir

def determine_next_trial_num(base_result_dir, current_date):
    """
    Determines the next trial number based on existing trials for the current date.
    
    Parameters:
    - base_result_dir (str): Base directory for results.
    - current_date (str): Current date in 'YYYY-MM-DD' format.
    
    Returns:
    - trial_num (int): Next available trial number.
    """
    date_result_dir = os.path.join(base_result_dir, current_date)
    os.makedirs(date_result_dir, exist_ok=True)
    
    existing_trials = [
        name for name in os.listdir(date_result_dir)
        if os.path.isdir(os.path.join(date_result_dir, name)) and name.startswith("TestTrial")
    ]
    
    if not existing_trials:
        return 1
    else:
        # Extract trial numbers and determine the next one
        trial_numbers = [int(name.replace("TestTrial", "")) for name in existing_trials if name.replace("TestTrial", "").isdigit()]
        return max(trial_numbers) + 1 if trial_numbers else 1

def load_config(config_path=test_config_now):
    """
    Loads the test configuration from a YAML file.
    
    Parameters:
    - config_path (str): Path to the YAML configuration file.
    
    Returns:
    - config (dict): Parsed configuration dictionary.
    """
    # Determine the absolute path to the config file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_full_path = os.path.join(script_dir, config_path)

    if not os.path.exists(config_full_path):
        logging.error(f"Configuration file '{config_full_path}' not found.")
        raise FileNotFoundError(f"Configuration file '{config_full_path}' not found.")

    with open(config_full_path, 'r') as file:
        try:
            config = yaml.safe_load(file)
            return config
        except yaml.YAMLError as exc:
            logging.error(f"Error parsing the configuration file: {exc}")
            raise exc

def save_response(trial_result_dir, test_id, response_content):
    """
    Saves the response content of a test to a JSON file.
    
    Parameters:
    - trial_result_dir (str): Directory for the current trial's results.
    - test_id (int): ID of the test.
    - response_content (dict): Content to be saved.
    """
    # Define result file path
    result_file = os.path.join(trial_result_dir, f"test_{test_id}.json")

    # Save response content to file
    with open(result_file, 'w') as f:
        json.dump(response_content, f, indent=4)

def run_test(test, trial_num, trial_result_dir, logger, base_url='http://localhost:8000'):
    """
    Executes a single test case.
    
    Parameters:
    - test (dict): Test case details.
    - trial_num (int): Current trial number.
    - trial_result_dir (str): Directory to save test results.
    - logger (logging.Logger): Logger for the current trial.
    - base_url (str): Base URL of the API.
    
    Returns:
    - result (bool): True if the test passed, False otherwise.
    """
    url = base_url + test['endpoint']
    method = test['method'].upper()
    payload = test.get('payload', {})
    expected_status = test.get('expected_status', 200)
    test_id = test.get('id', 'unknown')

    try:
        logger.info(f"Executing Test ID {test_id}: {test['description']}")
        if method == "POST":
            response = requests.post(url, json=payload, timeout=30)  # Increased timeout
        elif method == "GET":
            response = requests.get(url, params=payload, timeout=30)
        else:
            logger.error(f"Unsupported HTTP method: {method}")
            return False

        # Attempt to parse JSON response
        try:
            response_content = response.json()
        except json.JSONDecodeError:
            response_content = {"status": "failed", "message": "Invalid JSON response"}
            logger.error(f"Test ID {test_id} received invalid JSON response.")

        # Save the response content regardless of pass or fail
        save_response(trial_result_dir, test_id, response_content)

        if response.status_code == expected_status:
            logger.info(f"Test '{test['description']}' Passed.")
            return True
        else:
            logger.error(f"Test '{test['description']}' Failed. Expected status {expected_status}, got {response.status_code}. Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Test '{test['description']}' encountered a request error: {e}")
        return False
    except Exception as e:
        logger.error(f"Test '{test['description']}' encountered an unexpected error: {e}")
        return False

def main():
    """
    Main function to execute all tests based on the configuration.
    """
    # Define base directories relative to the script's location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_log_dir = os.path.join(script_dir, '..', 'log')  # Adjust as needed
    base_result_dir = os.path.join(script_dir, '..', 'result')  # Adjust as needed

    # Load configuration
    try:
        config = load_config()
    except Exception as e:
        print(f"Failed to load configuration: {e}")
        exit(1)

    tests = config.get('tests', [])
    if not tests:
        print("No test cases found in the configuration.")
        exit(1)

    # Determine current date
    current_date = datetime.now().strftime("%Y-%m-%d")

    # Determine the next trial number
    trial_num = determine_next_trial_num(base_result_dir, current_date)

    # Setup logging for the current trial
    logger, date_log_dir = setup_logging(base_log_dir, trial_num)

    logger.info(f"Starting Test Trial {trial_num} on {current_date}")

    # Define trial result directory
    trial_result_dir = os.path.join(base_result_dir, current_date, f"TestTrial{trial_num}")
    os.makedirs(trial_result_dir, exist_ok=True)

    all_passed = True
    for test in tests:
        result = run_test(test, trial_num, trial_result_dir, logger)
        if not result:
            all_passed = False
        # Sleep between tests to avoid overwhelming the server
        time.sleep(1)

    if all_passed:
        logger.info(f"All test cases in Test Trial {trial_num} passed successfully.")
    else:
        logger.warning(f"Some test cases in Test Trial {trial_num} failed.")

if __name__ == "__main__":
    main()
