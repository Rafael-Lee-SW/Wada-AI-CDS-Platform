# app/main.py

import os
import logging
from datetime import datetime
import ray
from ray import serve
import time  # Ensure that 'time' is imported
from logging.handlers import TimedRotatingFileHandler

# Suppress TensorFlow oneDNN warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Set Ray Serve HTTP host to allow external access
os.environ["RAY_SERVE_HTTP_HOST"] = "0.0.0.0"  # Bind to all IP addresses
os.environ["RAY_SERVE_HTTP_KEEP_ALIVE_TIMEOUT_S"] = "10"  # Adjust timeout as needed

# Ensure the 'log' directory exists
log_directory = 'log'
if not os.path.exists(log_directory):
    os.makedirs(log_directory)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)  # Capture all levels of logs

# Define the base log filename
base_log_filename = 'server.log'
base_log_path = os.path.join(log_directory, base_log_filename)

# Create a TimedRotatingFileHandler that rotates logs daily at midnight
file_handler = TimedRotatingFileHandler(
    base_log_path,
    when='midnight',
    interval=1,
    backupCount=30,  # Keep logs for the last 30 days
    encoding='utf-8',
    delay=False,
    utc=False
)

# Set the suffix for the rotated log files
file_handler.suffix = "%Y-%m-%d.log"  # e.g., server.log.2024-10-30.log

# Define the log format
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)

# Add the file handler to the logger
logger.addHandler(file_handler)

# Create a StreamHandler to output logs to the console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)  # Adjust as needed (DEBUG, INFO, WARNING, etc.)
console_formatter = logging.Formatter('%(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

if __name__ == "__main__":
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
        logger.info("Ray has been initialized.")
    else:
        logger.info("Ray is already initialized.")
    
    # Import the ModelService after initializing Ray Serve
    from app.models_deployments import ModelService
    
    # Deploy the ModelService using the new Ray Serve API
    serve.run(ModelService.bind())
    logger.info("Ray Serve and FastAPI are running. Available endpoints:")
    logger.info("  - POST /predict")
    logger.info("  - GET /")
    
    # Keep the script running to keep the server alive
    try:
        while True:
            time.sleep(3600)  # Sleep for 1 hour
    except KeyboardInterrupt:
        logger.info("Shutting down the server...")
        ray.shutdown()
        logger.info("Ray has been shut down.")
