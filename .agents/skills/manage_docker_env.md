# Skill: Manage Docker Environment

## Purpose
Ensure the infrastructure (MongoDB) is properly set up and running to support API testing and development.

## Instructions
1. Check if Docker is running.
2. Start the services defined in `docker-compose.yml`:
   ```bash
   docker-compose up -d
   ```
3. Verify the MongoDB container is healthy:
   ```bash
   docker ps
   ```
4. Verify connection from Node.js using `test-db.js`:
   ```bash
   node test-db.js
   ```

## Troubleshooting
- If port 27017 is busy, check for local MongoDB instances.
- If the container fails to start, check `docker-compose logs`.
