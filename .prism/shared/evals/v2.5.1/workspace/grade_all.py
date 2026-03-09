"""Grade all eval outputs and aggregate into benchmark.json"""
import json, os, re, glob, statistics
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
ITER = os.path.join(BASE, "iteration-1")


def read_output(run_dir):
    """Read the output file from a run directory."""
    outputs_dir = os.path.join(run_dir, "outputs")
    for name in ["research.md", "transcript.md"]:
        p = os.path.join(outputs_dir, name)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
    return ""


def check_expectation(text, output):
    """Check if an expectation is met in the output. Returns (passed, evidence)."""
    output_lower = output.lower()
    text_lower = text.lower()

    # Extract key phrases from the expectation
    checks = []

    # Common pattern-based checks
    patterns = {
        r"file:line references?": lambda o: bool(re.search(r'\w+\.\w+:\d+', o)),
        r"yyyy-mm-dd.*naming": lambda o: bool(re.search(r'\d{4}-\d{2}-\d{2}', o)),
        r"saved? to .prism/shared/research": lambda o: ".prism/shared/research" in o_lower(o),
        r"saved? to .prism/shared/plans": lambda o: ".prism/shared/plans" in o_lower(o),
        r"no improvement suggest|no.* critiq|documentarian": lambda o: not any(
            w in o_lower(o) for w in ["should be improved", "recommendation:", "suggest improving"]
        ) or "documentarian" in o_lower(o),
        r"research question|summary|files discovered|component analysis": lambda o: sum(
            1 for s in ["research question", "summary", "files discovered", "component analysis", "## summary", "## files", "## research"]
            if s in o_lower(o)
        ) >= 2,
        r"required sections": lambda o: sum(
            1 for s in ["##", "summary", "analysis", "findings", "overview"]
            if s in o_lower(o)
        ) >= 2,
        r"parallel.*agent|spawn.*agent|sub-?agent": lambda o: any(
            w in o_lower(o) for w in ["agent", "subagent", "sub-agent", "parallel", "spawn"]
        ),
        r"plan.*phase|phase.*plan|implementation plan": lambda o: any(
            w in o_lower(o) for w in ["phase", "plan", "implementation"]
        ),
        r"success criteria|verification": lambda o: any(
            w in o_lower(o) for w in ["success criteria", "verification", "verify", "criteria"]
        ),
        r"automated.*manual|two.*categor": lambda o: (
            "automated" in o_lower(o) and "manual" in o_lower(o)
        ) or "verification" in o_lower(o),
        r"user.*approv|interactive|user.*buy-in|confirm": lambda o: any(
            w in o_lower(o) for w in ["user", "approval", "interactive", "confirm", "buy-in"]
        ),
        r"todowrite|todo": lambda o: any(
            w in o_lower(o) for w in ["todowrite", "todo", "tracking"]
        ),
        r"spectrum|signal|promise": lambda o: any(
            w in o_lower(o) for w in ["spectrum", "signal", "promise", "<spectrum"]
        ),
        r"stories?\.json": lambda o: "stories.json" in o_lower(o) or "stories" in o_lower(o),
        r"quality gate": lambda o: any(
            w in o_lower(o) for w in ["quality gate", "quality check", "gate"]
        ),
        r"wireframe|screen|flow|persona": lambda o: any(
            w in o_lower(o) for w in ["wireframe", "screen", "flow", "persona"]
        ),
        r"prd|product requirements": lambda o: any(
            w in o_lower(o) for w in ["prd", "product requirements", "requirements document"]
        ),
        r"vitepress|documentation site": lambda o: any(
            w in o_lower(o) for w in ["vitepress", "documentation", "docs"]
        ),
        r"version.*bump|semantic|changelog": lambda o: any(
            w in o_lower(o) for w in ["version", "bump", "semantic", "changelog", "release"]
        ),
        r"debug|investigat|log|error": lambda o: any(
            w in o_lower(o) for w in ["debug", "investigat", "log", "error", "issue"]
        ),
        r"browser|screenshot|playwright": lambda o: any(
            w in o_lower(o) for w in ["browser", "screenshot", "playwright", "visual"]
        ),
        r"eval.*case|benchmark|grad": lambda o: any(
            w in o_lower(o) for w in ["eval", "benchmark", "grading", "grade"]
        ),
    }

    def o_lower(o):
        return o.lower()

    # Try pattern matching first
    for pattern, checker in patterns.items():
        if re.search(pattern, text_lower):
            passed = checker(output)
            if passed:
                # Find evidence
                for line in output.split("\n"):
                    line_lower = line.lower().strip()
                    keywords = [w for w in re.findall(r'\w+', text_lower) if len(w) > 3]
                    if any(kw in line_lower for kw in keywords[:3]):
                        return True, line.strip()[:200]
                return True, f"Content matches expectation pattern"
            # Don't immediately fail - fall through to keyword check

    # Keyword-based fallback: extract significant words and check coverage
    keywords = [w for w in re.findall(r'\b\w{4,}\b', text_lower)
                if w not in {"this", "that", "with", "from", "have", "been", "does",
                             "should", "would", "could", "just", "only", "also", "each",
                             "than", "them", "their", "they", "will", "were", "what",
                             "when", "which", "into", "over", "such", "about", "after",
                             "before", "between", "through", "during", "being", "those",
                             "these", "some", "other", "more", "most", "very", "appear",
                             "output", "document", "includes", "follows", "contains"}]

    if not keywords:
        return True, "No specific keywords to check"

    found = sum(1 for kw in keywords if kw in output_lower)
    ratio = found / len(keywords) if keywords else 0

    if ratio >= 0.4:
        # Find a line with evidence
        for line in output.split("\n"):
            line_lower = line.lower().strip()
            if any(kw in line_lower for kw in keywords[:5]):
                return True, line.strip()[:200]
        return True, f"{found}/{len(keywords)} key terms found in output"

    return False, f"Only {found}/{len(keywords)} key terms found: {keywords[:5]}"


def grade_run(run_dir):
    """Grade a single run and write grading.json."""
    output = read_output(run_dir)
    if not output:
        return None

    # Read parent eval_metadata.json
    parent = os.path.dirname(run_dir)
    meta_path = os.path.join(parent, "eval_metadata.json")
    if not os.path.exists(meta_path):
        return None

    with open(meta_path, "r") as f:
        meta = json.load(f)

    expectations = meta.get("expectations", [])
    results = []
    for exp_text in expectations:
        passed, evidence = check_expectation(exp_text, output)
        results.append({
            "text": exp_text,
            "passed": passed,
            "evidence": evidence
        })

    passed_count = sum(1 for r in results if r["passed"])
    total = len(results)
    summary = {
        "passed": passed_count,
        "failed": total - passed_count,
        "total": total,
        "pass_rate": round(passed_count / total, 2) if total > 0 else 0
    }

    grading = {"expectations": results, "summary": summary}
    grading_path = os.path.join(run_dir, "grading.json")
    with open(grading_path, "w") as f:
        json.dump(grading, f, indent=2)

    return grading


def main():
    # Grade all runs
    eval_dirs = sorted(glob.glob(os.path.join(ITER, "*")))
    all_runs = []

    for eval_dir in eval_dirs:
        if not os.path.isdir(eval_dir):
            continue
        eval_name = os.path.basename(eval_dir)

        meta_path = os.path.join(eval_dir, "eval_metadata.json")
        if not os.path.exists(meta_path):
            continue

        with open(meta_path, "r") as f:
            meta = json.load(f)

        for config_dir, config_name in [("with_skill", "with_skill"), ("old_skill", "without_skill")]:
            run_dir = os.path.join(eval_dir, config_dir)
            if not os.path.isdir(run_dir):
                continue

            grading = grade_run(run_dir)
            if grading is None:
                continue

            run_entry = {
                "eval_id": f"{meta['skill']}-eval-{meta['eval_id']}",
                "eval_name": meta["dimension"].replace("_", " ").title(),
                "skill": meta["skill"],
                "configuration": config_name,
                "run_number": 1,
                "result": {
                    "pass_rate": grading["summary"]["pass_rate"],
                    "passed": grading["summary"]["passed"],
                    "failed": grading["summary"]["failed"],
                    "total": grading["summary"]["total"],
                    "time_seconds": 0,
                    "tokens": 0,
                    "tool_calls": 0,
                    "errors": 0,
                }
            }
            all_runs.append(run_entry)
            print(f"  {config_name:15s} {eval_name:40s} pass_rate={grading['summary']['pass_rate']:.0%} ({grading['summary']['passed']}/{grading['summary']['total']})")

    # Aggregate benchmark
    with_skill_runs = [r for r in all_runs if r["configuration"] == "with_skill"]
    without_skill_runs = [r for r in all_runs if r["configuration"] == "without_skill"]

    def calc_stats(runs):
        rates = [r["result"]["pass_rate"] for r in runs]
        if not rates:
            return {"count": 0}
        return {
            "pass_rate": {
                "mean": round(statistics.mean(rates), 3),
                "stddev": round(statistics.stdev(rates), 3) if len(rates) > 1 else 0,
                "min": round(min(rates), 3),
                "max": round(max(rates), 3),
            },
            "count": len(rates)
        }

    with_stats = calc_stats(with_skill_runs)
    without_stats = calc_stats(without_skill_runs)

    # Per-skill breakdown
    skills = sorted(set(r["skill"] for r in all_runs))
    skill_summary = {}
    for skill in skills:
        ws = [r for r in with_skill_runs if r["skill"] == skill]
        wos = [r for r in without_skill_runs if r["skill"] == skill]
        ws_mean = statistics.mean([r["result"]["pass_rate"] for r in ws]) if ws else 0
        wos_mean = statistics.mean([r["result"]["pass_rate"] for r in wos]) if wos else None
        skill_summary[skill] = {
            "v2.5.1": round(ws_mean, 2),
            "v2.4.8": round(wos_mean, 2) if wos_mean is not None else "N/A",
            "delta": round(ws_mean - wos_mean, 2) if wos_mean is not None else "N/A",
            "evals": len(ws)
        }

    ws_pr = with_stats.get("pass_rate", {})
    wos_pr = without_stats.get("pass_rate", {})
    delta_pr = round(ws_pr.get("mean", 0) - wos_pr.get("mean", 0), 3) if wos_pr else "N/A"

    # Get unique eval IDs for metadata
    eval_ids = sorted(set(r["eval_id"] for r in all_runs))

    benchmark = {
        "metadata": {
            "skill_name": "Prism v2.5.1 vs v2.4.8",
            "executor_model": "claude-opus-4-6",
            "comparison": "v2.5.1 (with_skill) vs v2.4.8-snapshot (without_skill)",
            "timestamp": datetime.now().isoformat(),
            "evals_run": eval_ids,
            "runs_per_configuration": 1,
        },
        "runs": all_runs,
        "run_summary": {
            "with_skill": with_stats,
            "without_skill": without_stats,
            "delta": {
                "pass_rate": f"{delta_pr:+.3f}" if isinstance(delta_pr, float) else delta_pr,
            }
        },
        "skill_summary": skill_summary,
        "notes": [
            "prism-eval skill has no v2.4.8 baseline (it was introduced in v2.5.0)",
            "Grading uses keyword matching against expectation text",
            "Timing data not available due to context window refresh"
        ]
    }

    benchmark_path = os.path.join(ITER, "benchmark.json")
    with open(benchmark_path, "w") as f:
        json.dump(benchmark, f, indent=2)

    print(f"\n{'='*60}")
    print(f"BENCHMARK SUMMARY: v2.5.1 vs v2.4.8")
    print(f"{'='*60}")
    print(f"Total eval runs: {len(all_runs)} ({len(with_skill_runs)} v2.5.1, {len(without_skill_runs)} v2.4.8)")
    print(f"v2.5.1 mean pass rate: {ws_pr.get('mean',0):.1%} ± {ws_pr.get('stddev',0):.1%}")
    print(f"v2.4.8 mean pass rate: {wos_pr.get('mean',0):.1%} ± {wos_pr.get('stddev',0):.1%}")
    delta = ws_pr.get('mean',0) - wos_pr.get('mean',0) if wos_pr else 0
    print(f"Delta: {delta:+.1%}")
    print(f"\nPer-skill breakdown:")
    print(f"{'Skill':<25s} {'v2.5.1':>8s} {'v2.4.8':>8s} {'Delta':>8s} {'Evals':>6s}")
    print(f"{'-'*25} {'-'*8} {'-'*8} {'-'*8} {'-'*6}")
    for skill, data in sorted(skill_summary.items()):
        v251 = f"{data['v2.5.1']:.0%}"
        v248 = f"{data['v2.4.8']:.0%}" if data['v2.4.8'] != "N/A" else "N/A"
        d = f"{data['delta']:+.0%}" if data['delta'] != "N/A" else "N/A"
        print(f"{skill:<25s} {v251:>8s} {v248:>8s} {d:>8s} {data['evals']:>6d}")

    print(f"\nBenchmark saved to: {benchmark_path}")


if __name__ == "__main__":
    main()
