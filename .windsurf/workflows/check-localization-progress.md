---
description: Check localization progress (auto-run, no pre-checks)
auto_execution_mode: 3
---

Assumptions:
- .twosky.json is valid and present at repo root
- Network is not required for `check` (offline)
- Do not open files; just run the command and return output

Steps:
1. Set working directory to the repository root.
// turbo
2. Run the check and print raw output:

./Support/Scripts/localize.rb check -l all -b

3. Summarize briefly:
- List locales below 85%.
- Highlight any missing base files reported.
- End with a one-line summary: "Localization check completed."
