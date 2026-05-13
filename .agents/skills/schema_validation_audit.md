# Skill: Project Schema Validation

## Purpose
Ensure that all project configuration files (`package.json`, `docker-compose.yml`, etc.) follow the required standards for a successful deployment and maintenance.

## Instructions
1. Run the schema validation:
   ```bash
   pnpm run test:schema
   ```
2. **Review Errors**:
   - **package.json**: Ensure `name`, `version`, and `main` are present.
   - **QA Scripts**: Verify that all required QA commands (`lint`, `test:smoke`, `test:security`, `test:accessibility`) are defined in the `scripts` section.
   - **Docker**: If a `docker-compose.yml` is used, it must contain a `services` section.
3. If errors are found, fix the missing fields in the respective files before attempting a deployment.
4. Results are archived in `test_results_utf8.txt`.

## Success Criteria
- The validation exits with status 0.
- No missing mandatory fields in `package.json`.
