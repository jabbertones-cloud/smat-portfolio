"""Guard against exposing public pull requests to persistent M1 runners.

Public standard ubuntu-24.04 is an isolated GitHub VM and is free for public
repositories.  Never substitute larger or custom paid runner labels.
"""
import re
import unittest
from pathlib import Path

WORKFLOWS = Path(__file__).resolve().parents[1] / ".github" / "workflows"
PRODUCTION = ("audit-public-site.yml", "deploy.yml", "verify-website.yml")
EXPECTED_RUNNER = "ubuntu-24.04"
PHYSICAL_M1 = re.compile(r"\b(?:self-hosted|smat-m1|Tatsheens-Mini)\b", re.I)


def validate_workflow(name: str, source: str) -> None:
    labels = re.findall(r"^\s*runs-on:\s*(.*?)\s*$", source, re.M)
    if name == "ci-failure-auto-fix.yml":
        if "if: false" not in source:
            raise AssertionError("disabled auto-fix workflow cannot activate")
        return
    if name not in PRODUCTION:
        raise AssertionError(f"unreviewed workflow: {name}")
    if labels != [EXPECTED_RUNNER]:
        raise AssertionError(f"{name}: expected one standard Ubuntu job; got {labels!r}")
    if PHYSICAL_M1.search(source):
        raise AssertionError(f"{name}: persistent-runner identifier found")
    for proof in ('RUNNER_ENVIRONMENT:-}', 'RUNNER_OS:-}', 'RUNNER_ARCH:-}', 'github-hosted', 'Linux', 'X64'):
        if proof not in source:
            raise AssertionError(f"{name}: missing hosted runner identity proof {proof}")
    if source.index('Require isolated GitHub standard runner') > source.index('actions/checkout@v4'):
        raise AssertionError(f"{name}: isolated runner must be asserted before checkout")


class PublicStandardRunnerPolicyTests(unittest.TestCase):
    def test_all_workflows_have_a_reviewed_runner_policy(self):
        files = sorted(WORKFLOWS.glob("*.yml"))
        self.assertEqual({p.name for p in files}, {*PRODUCTION, "ci-failure-auto-fix.yml"})
        for p in files:
            with self.subTest(workflow=p.name):
                validate_workflow(p.name, p.read_text())

    def test_reject_private_runners_and_paid_or_unknown_labels(self):
        source = (WORKFLOWS / PRODUCTION[0]).read_text()
        for label in ("[self-hosted, macOS, ARM64]", "macos-15-xlarge", "ubuntu-latest"):
            with self.subTest(label=label):
                with self.assertRaises(AssertionError):
                    validate_workflow(PRODUCTION[0], source.replace("runs-on: ubuntu-24.04", "runs-on: " + label))

    def test_reject_missing_early_host_verification(self):
        source = (WORKFLOWS / PRODUCTION[0]).read_text()
        with self.assertRaises(AssertionError):
            validate_workflow(PRODUCTION[0], source.replace("RUNNER_ENVIRONMENT:-}", "WRONG_ENVIRONMENT:-}"))


if __name__ == "__main__":
    unittest.main()
