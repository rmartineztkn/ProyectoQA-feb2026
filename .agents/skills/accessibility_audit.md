# Skill: A11y Accessibility Audit

## Purpose
Verify that the application complies with WCAG standards (Web Content Accessibility Guidelines) to ensure inclusivity for all users.

## Instructions
1. Run the accessibility scan:
   ```bash
   pnpm run test:accessibility
   ```
2. **Review Violations**:
   - The script will list violations by **Impact** (Critical, Serious, Moderate, Minor).
   - Pay special attention to **Critical/Serious** issues like missing `alt` tags or insufficient color contrast.
3. **Manual Verification**:
   - Check if the site can be navigated using only the `TAB` key.
   - Verify that form inputs have associated `<label>` tags.
4. Results are archived in `test_results_utf8.txt`.

## Success Criteria
- Zero "Critical" or "Serious" violations reported by the axe-core engine.
- All interactive elements have descriptive names (aria-labels).
