import requests
import json

# Test the backend directly
def test_backend():
    print("Testing URL Health Monitor Backend...")
    
    # Test the health endpoint
    try:
        health_response = requests.get("http://localhost:8000/health")
        print(f"Health check status: {health_response.status_code}")
        print(f"Health check response: {health_response.json()}")
    except Exception as e:
        print(f"Health check failed: {str(e)}")
    
    # Test the URL checking endpoint
    try:
        urls_to_check = ["https://google.com", "https://github.com"]
        print(f"Checking URLs: {urls_to_check}")
        
        check_response = requests.post(
            "http://localhost:8000/check-urls",
            json={"urls": urls_to_check}
        )
        
        print(f"URL check status: {check_response.status_code}")
        print(f"URL check response: {json.dumps(check_response.json(), indent=2)}")
    except Exception as e:
        print(f"URL check failed: {str(e)}")

if __name__ == "__main__":
    test_backend()
