# Definition of Agentic Skills

## What is a Skill?
A skill in this repository is a markdown document that defines a specific capability for an AI agent. It acts as a "SOP" (Standard Operating Procedure) that the agent must follow to achieve a high-quality outcome.

## Structure of a Skill File
Every skill file in `.agents/skills/` should follow this structure:
1. **Purpose**: Brief description of what the skill achieves.
2. **Prerequisites**: Tools or environment state needed (e.g., Docker running).
3. **Instructions**: Step-by-step commands and logic.
4. **Success Criteria**: How to validate the task is complete.

## How to Add New Skills
1. Identify a repetitive QA task.
2. Create a new `.md` file in `.agents/skills/`.
3. Document the commands and expected outputs.
4. Test the skill by asking the AI agent to execute it.
