from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class URLBase(BaseModel):
    url: str

class URLCreate(URLBase):
    pass

class URL(URLBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class HealthCheckBase(BaseModel):
    url_id: int
    status: bool
    response_time: float
    status_code: Optional[int] = None

class HealthCheckCreate(HealthCheckBase):
    pass

class HealthCheck(HealthCheckBase):
    id: int
    checked_at: datetime
    
    class Config:
        orm_mode = True

class URLWithHealthChecks(URL):
    health_checks: List[HealthCheck] = []
    
    class Config:
        orm_mode = True

class URLCheckRequest(BaseModel):
    urls: List[str]

class URLHealthStatus(BaseModel):
    url: str
    status: str  # "UP" or "DOWN"
    response_time: Optional[float] = None
    status_code: Optional[int] = None
    checked_at: datetime
