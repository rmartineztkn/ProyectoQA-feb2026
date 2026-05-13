# Skill: Code Quality & Linting

## Purpose
Ensure the codebase adheres to the defined coding standards and identify potential errors early using ESLint.

## Instructions
1. Run the linter across the entire project:
   ```bash
   pnpm run lint
   ```
2. If errors are found:
   - Identify the file and line number.
   - For simple style fixes (semi-colons, quotes), run:
     ```bash
     npx eslint . --fix
     ```
   - For logic errors (unused variables, undefined globals), manually refactor the code.
3. Verify that the linter passes before committing any changes.

## Success Criteria
- Command `pnpm run lint` returns with exit code 0.
- No "error" level warnings in the terminal.
