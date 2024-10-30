# app/main.py

import os
import logging
from datetime import datetime
import ray
from ray import serve
import time  # Ensure that 'time' is imported

# Suppress TensorFlow oneDNN warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Ensure the 'log' directory exists
log_directory = 'log'
if not os.path.exists(log_directory):
    os.makedirs(log_directory)

# Configure logging
logging.basicConfig(
    filename=f'{log_directory}/server_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

if __name__ == "__main__":
    # Initialize Ray
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)

    # Import the ModelService after initializing Ray Serve
    from app.models_deployments import ModelService

    # Deploy the ModelService using the new Ray Serve API
    serve.run(ModelService.bind())

    print("Ray Serve and FastAPI are running. Available endpoints:")
    print("  - POST /predict")
    print("  - GET /")

    # Keep the script running to keep the server alive
    try:
        while True:
            time.sleep(3600)  # Sleep for 1 hour
    except KeyboardInterrupt:
        print("Shutting down the server...")
        ray.shutdown()
