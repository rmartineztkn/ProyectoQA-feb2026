# Skill: Smoke Test Execution (Production Readiness)

## Purpose
Perform a high-level verification of the application's core functionality to ensure the environment is stable and critical paths are operational.

## Prerequisites
- Application server running (`pnpm run dev`).
- Database (MongoDB) accessible.

## Instructions
1. Execute the smoke test suite:
   ```bash
   pnpm run test:smoke
   ```
2. Verify the three critical flows:
   - **Accessibility**: The `/champions` page returns HTTP 200 and the correct title.
   - **Data Integration**: The table is populated with at least one record (BFF-DB connection check).
   - **API Health**: The `/items` endpoint returns valid JSON data.
3. If any flow fails:
   - **STOP IMMEDIATELY**.
   - Check if Docker is running (`docker ps`).
   - Check server logs for connection timeouts.
   - Report as a **Critical Blocking Issue**.

## Expected Outcome
- All 3 tests pass in less than 30 seconds.
- Confidence that the system is ready for deeper functional testing.
