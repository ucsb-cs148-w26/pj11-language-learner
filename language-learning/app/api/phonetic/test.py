import requests
import json

BASE_URL = "http://localhost:3000/api/phonetic"

message_id = "cc9d6158-9b08-44c7-9440-552729780112"

url = f"{BASE_URL}/{message_id}"
print(url)

resp = requests.get(url)

print("Status:", resp.status_code)

try:
    print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
except:
    print(resp.text)