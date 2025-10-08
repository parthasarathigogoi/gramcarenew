import requests
import json

url = "http://localhost:5000/api/sms/send"
headers = {'Content-Type': 'application/json'}
data = {
    "to": "+918822459141",  # Replace with a valid phone number
    "message": "Hello from GramCare SMS!"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(response.status_code)
    print(response.json())
except requests.exceptions.ConnectionError as e:
    print(f"Connection Error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")