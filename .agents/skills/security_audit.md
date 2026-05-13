# Skill: Security & Secrets Audit

## Purpose
Identify exposed credentials and high-risk vulnerabilities in dependencies to ensure the application's posture remains secure.

## Instructions
1. Run the security audit:
   ```bash
   pnpm run test:security
   ```
2. **Review Dependency Audit**:
   - If `pnpm audit` reports high/critical vulnerabilities, run `pnpm audit fix` and re-test.
   - If a vulnerability cannot be fixed automatically, report it as a **Security Risk**.
3. **Review Secrets Scan**:
   - If the script flags a "MongoDB Credential" or "Generic Secret", find the file and line.
   - **Correction**: Move the secret to an environment variable (`.env`) and ensure the file is in `.gitignore`.
4. The results are automatically archived in `test_results_utf8.txt`.

## Success Criteria
- No high/critical vulnerabilities reported by `npm audit`.
- No hardcoded secrets detected in the core files (`index.js`, `docker-compose.yml`).
