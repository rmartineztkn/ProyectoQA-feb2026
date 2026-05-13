# Skill: Validate Data Integrity

## Purpose
Ensure that the JSON data files (`champions.json`, `objetos.json`) are correctly formatted and contain all required fields for the application.

## Instructions
1. Scan `champions.json`:
   - Verify it is valid JSON.
   - Check that each champion has a `name`, `role`, and `id`.
2. Scan `objetos.json`:
   - Verify it is valid JSON.
   - Check for `price`, `stats`, and `category`.
3. If inconsistencies are found, flag them for manual correction or use an automated script if available (e.g., `db_check.json` logic).

## Expected Outcome
- A confirmation that data files are consistent and ready for import/migration.
