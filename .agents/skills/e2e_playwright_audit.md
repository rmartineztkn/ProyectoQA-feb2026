# Skill: E2E Testing (Playwright)

## Purpose
Validate the complete user journey from end-to-end, ensuring that all integrated components (UI, BFF, DB) work together as expected in a real browser environment.

## Instructions
1. Run the E2E test suite:
   ```bash
   pnpm run test:e2e
   ```
2. **Review Test Results**:
   - Playwright will run tests in headless mode by default.
   - If a test fails, a screenshot and trace will be generated in `playwright-report/`.
3. **Common Flows**:
   - **Creation Flow**: Verifies that a user can fill a form and save a record.
   - **Verification Flow**: Verifies that the saved record appears correctly in the list.
   - **Deletion Flow**: Verifies that a user can remove a record and it disappears from the UI.
4. **Post-Deployment**:
   - To run against a different environment (e.g., Production), update the `baseURL` in `playwright.config.js`.

## Success Criteria
- All tests pass in the Chromium project.
- No dangling data remains (the tests should clean up after themselves).
