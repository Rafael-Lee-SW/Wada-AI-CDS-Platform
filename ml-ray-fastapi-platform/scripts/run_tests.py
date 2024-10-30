# scripts/run_tests.py

import requests
import yaml
import logging
from datetime import datetime
import os
import time
import json

def setup_logging():
    # Define log directory and file
    log_dir = f'log/{datetime.now().strftime("%Y-%m-%d")}-test-log'
    os.makedirs(log_dir, exist_ok=True)
    log_file = f"{log_dir}/test_run_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    # Configure logging
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter('%(levelname)s - %(message)s')
    console.setFormatter(formatter)
    logging.getLogger('').addHandler(console)

def load_config(config_path='test_config.yaml'):
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

def save_response(test_id, response_content):
    # Define result directory and file
    result_dir = f"result/{datetime.now().strftime('%Y-%m-%d')}"
    os.makedirs(result_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    result_file = f"{result_dir}/test_{test_id}_{timestamp}.json"

    # Save response content to file
    with open(result_file, 'w') as f:
        json.dump(response_content, f, indent=4)

def run_test(test, base_url='http://localhost:8000'):
    url = base_url + test['endpoint']
    method = test['method'].upper()
    payload = test.get('payload', {})
    expected_status = test.get('expected_status', 200)
    test_id = test.get('id', 'unknown')

    try:
        if method == "POST":
            response = requests.post(url, json=payload)
        elif method == "GET":
            response = requests.get(url, params=payload)
        else:
            logging.error(f"Unsupported HTTP method: {method}")
            return False

        # Save the response content regardless of pass or fail
        save_response(test_id, response.json())

        if response.status_code == expected_status:
            logging.info(f"Test '{test['description']}' Passed.")
            return True
        else:
            logging.error(f"Test '{test['description']}' Failed. Expected status {expected_status}, got {response.status_code}. Response: {response.text}")
            return False
    except Exception as e:
        logging.error(f"Test '{test['description']}' encountered an error: {e}")
        return False

def main():
    setup_logging()
    try:
        config = load_config()
    except Exception as e:
        logging.error(f"Failed to load configuration: {e}")
        exit(1)

    tests = config.get('tests', [])
    if not tests:
        logging.error("No test cases found in the configuration.")
        exit(1)

    all_passed = True
    for test in tests:
        logging.info(f"Running Test ID {test['id']}: {test['description']}")
        result = run_test(test)
        if not result:
            all_passed = False
        # Sleep between tests to avoid overwhelming the server
        time.sleep(1)

    if all_passed:
        logging.info("All test cases passed successfully.")
    else:
        logging.warning("Some test cases failed.")

if __name__ == "__main__":
    main()
