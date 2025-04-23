# Fullstack_Dashboard_Project

## Running with Docker

This project uses Docker to containerize both the backend and frontend services. The setup uses Node.js version 22.13.1 for both services, as specified in the Dockerfiles.

### Requirements
- Docker and Docker Compose installed on your system.
- The backend requires environment variables, which should be provided in `backend/.env` (not included in the image; see `backend/.env` for required variables).

### Build and Run

To build and start both the backend and frontend services:

```sh
# From the project root directory
docker compose up --build
```

This will:
- Build the backend from `./backend` and expose it on port **5000**.
- Build the frontend from `./frontend` and expose it on port **3000**.

### Service Details
- **Backend** (`js-backend`):
  - Node.js 22.13.1 (slim)
  - Exposes port **5000**
  - Requires environment variables (see `backend/.env`)
- **Frontend** (`js-frontend`):
  - Node.js 22.13.1 (slim)
  - Exposes port **3000**
  - Serves the React build using `serve`

### Notes
- The backend `.env` file is not included in the Docker image; ensure you provide it in `backend/.env` before running.
- Both services run as non-root users for improved security.
- The services are connected via a Docker network (`app-network`).

