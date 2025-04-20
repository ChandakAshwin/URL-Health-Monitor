from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import aiohttp
import asyncio
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

from models import get_db, URL, HealthCheck
import schemas

app = FastAPI(title="URL Health Monitor API")

# Enable CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a simple health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

async def check_url_health(url: str) -> Dict[str, Any]:
    """Check if a URL is up or down and measure response time."""
    start_time = time.time()
    result = {
        "url": url,
        "status": "DOWN",
        "response_time": None,
        "status_code": None,
        "checked_at": datetime.utcnow()
    }
    
    try:
        # Add headers to mimic a browser request
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        # Use a longer timeout for slow sites
        timeout = aiohttp.ClientTimeout(total=15)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers, allow_redirects=True) as response:
                end_time = time.time()
                result["response_time"] = (end_time - start_time) * 1000  # Convert to ms
                result["status_code"] = response.status
                result["status"] = "UP" if response.status < 400 else "DOWN"
    except aiohttp.ClientConnectorError as e:
        # Connection error (DNS failure, refused connection, etc)
        result["status"] = "DOWN"
        print(f"Connection error for {url}: {str(e)}")
    except aiohttp.ClientTimeout as e:
        # Timeout error
        result["status"] = "DOWN"
        print(f"Timeout error for {url}: {str(e)}")
    except Exception as e:
        # Any other error
        result["status"] = "DOWN"
        print(f"Error checking {url}: {str(e)}")
    
    return result

@app.post("/check-urls", response_model=List[schemas.URLHealthStatus])
async def check_urls(url_request: schemas.URLCheckRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Check the health of multiple URLs and store the results."""
    print(f"Received request to check URLs: {url_request.urls}")
    results = []
    
    if not url_request.urls:
        print("No URLs provided in request")
        return results
    
    try:
        # Check all URLs concurrently
        tasks = [check_url_health(url) for url in url_request.urls]
        health_results = await asyncio.gather(*tasks)
        print(f"Health check results: {health_results}")
        
        # Store results in database
        for result in health_results:
            try:
                # Get or create URL record
                db_url = db.query(URL).filter(URL.url == result["url"]).first()
                if not db_url:
                    db_url = URL(url=result["url"])
                    db.add(db_url)
                    db.commit()
                    db.refresh(db_url)
                
                # Create health check record
                health_check = HealthCheck(
                    url_id=db_url.id,
                    status=result["status"] == "UP",
                    response_time=result["response_time"] if result["response_time"] is not None else 0,
                    status_code=result["status_code"],
                )
                db.add(health_check)
                db.commit()
                
                results.append(result)
                print(f"Successfully processed result for {result['url']}")
            except Exception as e:
                print(f"Error processing result for {result['url']}: {str(e)}")
                # Still append the result even if database storage fails
                results.append(result)
    except Exception as e:
        print(f"Error checking URLs: {str(e)}")
    
    return results

@app.get("/urls", response_model=List[schemas.URL])
def get_urls(db: Session = Depends(get_db)):
    """Get all URLs in the database."""
    return db.query(URL).all()

@app.get("/url/{url_id}/health-history", response_model=List[schemas.HealthCheck])
def get_url_health_history(url_id: int, db: Session = Depends(get_db)):
    """Get health check history for a specific URL."""
    # Check if URL exists
    db_url = db.query(URL).filter(URL.id == url_id).first()
    if not db_url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    # Get health checks for the URL
    health_checks = db.query(HealthCheck).filter(HealthCheck.url_id == url_id).order_by(HealthCheck.checked_at.desc()).all()
    return health_checks

@app.get("/url/{url_id}/metrics")
def get_url_metrics(url_id: int, days: int = 7, db: Session = Depends(get_db)):
    """Get metrics for a specific URL over a time period."""
    # Check if URL exists
    db_url = db.query(URL).filter(URL.id == url_id).first()
    if not db_url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    # Calculate time range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get health checks for the URL within the time range
    health_checks = db.query(HealthCheck).filter(
        HealthCheck.url_id == url_id,
        HealthCheck.checked_at >= start_date,
        HealthCheck.checked_at <= end_date
    ).all()
    
    # Calculate metrics
    total_checks = len(health_checks)
    if total_checks == 0:
        return {
            "url": db_url.url,
            "total_checks": 0,
            "uptime_percentage": 0,
            "average_response_time": 0,
            "time_period_days": days
        }
    
    up_checks = sum(1 for check in health_checks if check.status)
    uptime_percentage = (up_checks / total_checks) * 100
    
    # Calculate average response time (only for successful checks)
    successful_checks = [check for check in health_checks if check.status]
    average_response_time = sum(check.response_time for check in successful_checks) / len(successful_checks) if successful_checks else 0
    
    return {
        "url": db_url.url,
        "total_checks": total_checks,
        "uptime_percentage": uptime_percentage,
        "average_response_time": average_response_time,
        "time_period_days": days
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
