import requests
import json

url = "http://localhost:5000/api/whatsapp/send"
headers = {'Content-Type': 'application/json'}
data = {
    "to": "+918822459141",  # Replace with a valid WhatsApp number
    "message": "Hello from GramCare WhatsApp!"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(response.status_code)
    print(response.json())
except requests.exceptions.ConnectionError as e:
    print(f"Connection Error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")