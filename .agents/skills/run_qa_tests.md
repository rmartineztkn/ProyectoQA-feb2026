# Skill: Run QA Tests

## Purpose
Execute the automated test suite to ensure the stability of the Wild Rift BFF and Frontend components.

## Prerequisites
- Node.js installed.
- Dependencies installed (`npm install`).
- Docker services running (if database tests are included).

## Instructions
1. Run all tests using:
   ```bash
   npm test
   ```
2. To run a specific test file (e.g., e2e):
   ```bash
   npx jest tests/e2e.test.js
   ```
3. Observe the output. If failures occur, identify the failing component (Express API, Puppeteer navigation, or MongoDB connection).
4. Save the summary of results to `test_results.txt`.

## Success Criteria
- 0 failed tests.
- Coverage reports generated if applicable.
