# Base image
FROM python:3.10-slim

# Set working directory
WORKDIR /tmp

# Copy only requirements first for efficient caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project into the container
COPY . .

# Set PYTHONPATH to include /tmp
ENV PYTHONPATH=/tmp

# Expose the port
EXPOSE 8000 8282 8265

# Command to run the application
CMD ["python", "app/main.py"]
