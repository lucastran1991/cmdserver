import uvicorn
import os
import json
import sys
import socket

config_path = os.path.join(os.path.dirname(__file__), "../../config.json")


def check_port_available(host, port):
    """Check if a port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            return result != 0
    except Exception:
        return False


def find_available_port(host, start_port, max_attempts=10):
    """Find an available port starting from start_port"""
    for i in range(max_attempts):
        port = start_port + i
        if check_port_available(host, port):
            return port
    return None


try:
    with open(config_path) as config_file:
        config = json.load(config_file)
except FileNotFoundError:
    print(f"Config file not found at {config_path}")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"Invalid JSON in config file: {e}")
    sys.exit(1)

if __name__ == "__main__":
    host = config["backend"]["host"]
    port = config["backend"]["port"]

    # Check if the configured port is available
    if not check_port_available(host, port):
        print(f"Port {port} is already in use on {host}")

        # Try to find an available port
        available_port = find_available_port(host, port)
        if available_port:
            print(f"Using available port {available_port} instead")
            port = available_port
        else:
            print("No available ports found. Please check your configuration.")
            sys.exit(1)

    print(f"Starting server on {host}:{port}")
    print(f"API Documentation will be available at:")
    print(f"  Swagger UI: http://{host}:{port}/docs")
    print(f"  ReDoc: http://{host}:{port}/redoc")
    print(f"  OpenAPI JSON: http://{host}:{port}/openapi.json")

    try:
        uvicorn.run(
            "app.app:app",
            host=host,
            port=port,
            reload=True,  # Enable auto-reload for development
            log_level="info",
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)
