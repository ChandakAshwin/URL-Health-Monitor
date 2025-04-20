# URL Health Monitor

A comprehensive tool for monitoring the health and status of multiple URLs. This application allows users to:

- Input multiple URLs through a user-friendly interface
- Check if websites are up or down
- View response times and status codes
- Track the health of links over time with metrics
- Store historical data for all checks

## Features

- **Modern React Frontend**: Clean, responsive UI built with Material-UI
- **Fast Python Backend**: Powered by FastAPI for efficient API endpoints
- **Real-time Health Checks**: Concurrent URL checking with response time measurement
- **Historical Data**: Store and visualize past checks
- **Metrics Dashboard**: View uptime percentage and response time trends
- **Dockerized**: Easy deployment with Docker containers

## Tech Stack

- **Frontend**: React, Material-UI, Chart.js
- **Backend**: FastAPI (Python), SQLAlchemy
- **Database**: SQLite
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system

### Running the Application

1. Clone this repository
2. Navigate to the project directory
3. Run the application using Docker Compose:

```bash
docker-compose up -d
```

4. Access the application in your browser at: http://localhost

### Usage

1. Enter one or more URLs in the input field (one per line or comma-separated)
2. Click "Check URLs" to verify their status
3. View the results in the "URL Status" tab
4. Click "View Metrics" for any URL to see detailed metrics and history

## Development

### Backend Development

The backend is built with FastAPI and uses SQLAlchemy for database operations.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development

The frontend is built with React and Material-UI.

```bash
cd frontend
npm install
npm start
```

## Project Structure

```
url-health-monitor/
├── backend/
│   ├── main.py            # FastAPI application
│   ├── models.py          # Database models
│   ├── schemas.py         # Pydantic schemas
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Backend Docker configuration
├── frontend/
│   ├── src/               # React source code
│   ├── package.json       # Node.js dependencies
│   ├── nginx.conf         # Nginx configuration
│   └── Dockerfile         # Frontend Docker configuration
└── docker-compose.yml     # Docker Compose configuration
```
