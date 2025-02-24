# FastAPI Backend

This project is a boilerplate for a FastAPI backend application that includes user management features. It provides APIs for user authentication and retrieving user information.

## Project Structure

```
backend
├── app
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── users.py
│   └── config.json
├── requirements.txt
└── README.md
```

## Features

- User model with fields: username, firstname, lastname, id, and dateOfBirth.
- API endpoint for user login.
- API endpoint to retrieve the list of all users.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd backend
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Configure the backend settings in `app/config.json`:
   ```json
   {
       "host": "127.0.0.1",
       "port": 8000
   }
   ```

4. Run the application:
   ```
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

## Usage

- To log in, send a POST request to `/login` with the username and password.
- To get the list of all users, send a GET request to `/users`.

## License

This project is licensed under the MIT License.