# AGENT VALIDATION DIRECTIVE (NO PASS/FAIL TESTS)

> **CRITICAL RULE**: Do not create unit tests, mock assertions, or pass/fail test files.
> These repositories host MCPs (Model Context Protocol systems) intended exclusively for autonomous AI agents.
> Synthetic assertions create bloatware that obfuscates whether the system actually works in the real world.
>
> ### Real Verification vs. Fake Pass/Fail:
> 1. **Do not create mock tests**: Mock tests merely verify that a mock matches an assumption.
> 2. **Verification is Evidence & Reports**: A verification step must produce a real report from live or canonical data (e.g. real store orders, live SP-API or X12 adjudication outputs).
> 3. **The Agent is the Consumer**: Direct agent dogfooding against live endpoints with authentic queries and realistic inputs is the only valid proof of capability.
