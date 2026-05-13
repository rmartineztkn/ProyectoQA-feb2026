# Skill: API & Load Pulse Check

## Purpose
Simulate concurrent traffic to measure API performance, ensuring that the server handles bursts of requests without significant degradation in latency or success rate.

## Instructions
1. Run the load pulse check:
   ```bash
   pnpm run test:pulse
   ```
2. **Review Metrics**:
   - **Success Rate**: Must be 100%. Any failure indicates a server or DB crash.
   - **Avg Latency**: Ideally below 200ms. If it exceeds 500ms, the server is struggling.
   - **Max Latency**: If there is a huge gap between Avg and Max (e.g., Avg: 50ms, Max: 2000ms), there is a "cold start" or "blocking" issue.
3. If the status is `WARNING/FAILED`, investigate:
   - MongoDB connection pool settings.
   - Memory leaks in the Node.js process.
   - Unoptimized database queries (lack of indexes).
4. Results are automatically archived in `test_results_utf8.txt`.

## Success Criteria
- 100% success rate on 50 concurrent requests.
- Average latency < 500ms.
