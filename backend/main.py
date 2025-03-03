import uvicorn
import os
import json

config_path = os.path.join(os.path.dirname(__file__), "../../config.json")
with open(config_path) as config_file:
    config = json.load(config_file)

if __name__ == "__main__":
    uvicorn.run("app.app:app", host=config["backend"]["host"], port=config["backend"]["port"])