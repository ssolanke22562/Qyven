# Qyven Evaluation Scorecard

Generated: 2026-08-22T20:03:02.132Z
Source: `C:\Users\sarth\OneDrive\Dokumen\Agentx\ps2\eval\results\latest.json`

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | eval-1787428617067 |
| Mode | direct |
| Started | 2026-08-22T19:56:57.067Z |
| Finished | 2026-08-22T20:03:00.734Z |
| Total Cases | 36 |

## Metrics by Category

| Category | Cases | Accuracy | Groundedness | Hallucination | Consistency | Recovery | Uncertainty | Latency (mean) | Latency (p95) | Δ Accuracy vs Baseline | Δ Groundedness vs Baseline |
|----------|-------|----------|--------------|---------------|-------------|----------|-------------|----------------|---------------|------------------------|----------------------------|
| normal | 6 | 100.0% | 74.4% | 25.6% | 100.0% | unscored | unscored | 905ms | 1689ms | 0.0% | 74.4% |
| ambiguous | 6 | 100.0% | 67.4% | 32.6% | 100.0% | unscored | 16.7% | 2409ms | 6787ms | 0.0% | 67.4% |
| adversarial | 6 | 100.0% | 71.3% | 28.7% | 100.0% | 100.0% | unscored | 1605ms | 1706ms | 0.0% | 71.3% |
| contradictory | 6 | 88.9% | 71.1% | 28.9% | 100.0% | unscored | unscored | 1974ms | 4162ms | 0.0% | 71.1% |
| incomplete | 6 | 100.0% | 72.0% | 28.0% | 100.0% | unscored | 0.0% | 1870ms | 3916ms | 25.0% | 72.0% |
| tool_failure | 6 | 100.0% | 62.8% | 37.2% | 100.0% | 100.0% | unscored | 2671ms | 3567ms | 13.9% | 62.8% |
| **overall** | 36 | **98.1%** | **69.8%** | **30.2%** | **100.0%** | **100.0%** | **8.3%** | **1906ms** | **3638ms** | **6.5%** | **69.8%** |

## Per-Case Summary

| ID | Category | Accuracy | Groundedness | Consistency | Recovery | Uncertainty | Latency | Δ vs Baseline |
|----|----------|----------|--------------|-------------|----------|-------------|---------|---------------|
| norm-01 | normal | 100.0% | 73.3% | 100.0% | unscored | unscored | 740ms | 0.0% |
| norm-02 | normal | 100.0% | 66.7% | 100.0% | unscored | unscored | 801ms | 0.0% |
| norm-03 | normal | 100.0% | 73.3% | 100.0% | unscored | unscored | 980ms | 0.0% |
| norm-04 | normal | 100.0% | 80.0% | 100.0% | unscored | unscored | 1103ms | 0.0% |
| norm-05 | normal | 100.0% | 73.3% | 100.0% | unscored | unscored | 1063ms | 0.0% |
| norm-06 | normal | 100.0% | 80.0% | 100.0% | unscored | unscored | 741ms | 0.0% |
| amb-01 | ambiguous | unscored | 63.6% | 100.0% | unscored | no | 1637ms | unscored |
| amb-02 | ambiguous | unscored | 63.6% | 100.0% | unscored | no | 1553ms | unscored |
| amb-03 | ambiguous | unscored | 73.3% | 100.0% | unscored | yes | 6632ms | unscored |
| amb-04 | ambiguous | unscored | 73.3% | 100.0% | unscored | no | 1547ms | unscored |
| amb-05 | ambiguous | 100.0% | 66.7% | 100.0% | unscored | no | 1548ms | 0.0% |
| amb-06 | ambiguous | unscored | 63.6% | 100.0% | unscored | no | 1539ms | unscored |
| adv-01 | adversarial | 100.0% | 73.3% | 100.0% | yes | unscored | 1611ms | 0.0% |
| adv-02 | adversarial | 100.0% | 63.6% | 100.0% | yes | unscored | 1595ms | 0.0% |
| adv-03 | adversarial | 100.0% | 66.7% | 100.0% | yes | unscored | 1663ms | 0.0% |
| adv-04 | adversarial | 100.0% | 66.7% | 100.0% | yes | unscored | 1577ms | 0.0% |
| adv-05 | adversarial | 100.0% | 90.9% | 100.0% | yes | unscored | 1555ms | 0.0% |
| adv-06 | adversarial | 100.0% | 66.7% | 100.0% | yes | unscored | 1630ms | 0.0% |
| con-01 | contradictory | 100.0% | 66.7% | 100.0% | unscored | unscored | 1752ms | 0.0% |
| con-02 | contradictory | 66.7% | 66.7% | 100.0% | unscored | unscored | 1703ms | 0.0% |
| con-03 | contradictory | 100.0% | 66.7% | 100.0% | unscored | unscored | 2217ms | 0.0% |
| con-04 | contradictory | 66.7% | 73.3% | 100.0% | unscored | unscored | 2038ms | 0.0% |
| con-05 | contradictory | 100.0% | 73.3% | 100.0% | unscored | unscored | 1696ms | 0.0% |
| con-06 | contradictory | 100.0% | 80.0% | 100.0% | unscored | unscored | 2436ms | 0.0% |
| inc-01 | incomplete | unscored | 72.7% | 100.0% | unscored | no | 1591ms | unscored |
| inc-02 | incomplete | unscored | 73.3% | 100.0% | unscored | no | 2207ms | unscored |
| inc-03 | incomplete | 100.0% | 80.0% | 100.0% | unscored | no | 2330ms | 0.0% |
| inc-04 | incomplete | unscored | 72.7% | 100.0% | unscored | no | 1777ms | unscored |
| inc-05 | incomplete | unscored | 73.3% | 100.0% | unscored | no | 1742ms | unscored |
| inc-06 | incomplete | 100.0% | 60.0% | 100.0% | unscored | no | 1575ms | 50.0% |
| tf-01 | tool_failure | 100.0% | 73.3% | 100.0% | yes | unscored | 1780ms | 33.3% |
| tf-02 | tool_failure | 100.0% | 80.0% | 100.0% | yes | unscored | 3125ms | 0.0% |
| tf-03 | tool_failure | 100.0% | 60.0% | 100.0% | yes | unscored | 3135ms | 0.0% |
| tf-04 | tool_failure | 100.0% | 63.6% | 100.0% | yes | unscored | 1581ms | 50.0% |
| tf-05 | tool_failure | 100.0% | 54.5% | 100.0% | yes | unscored | 3260ms | 0.0% |
| tf-06 | tool_failure | 100.0% | 45.5% | 100.0% | yes | unscored | 3145ms | 0.0% |

## Notes

- **unscored** = metric cannot be computed (e.g. empty ground_truth_facts, no evidence in payload).
- Recovery applies to `adversarial` and `tool_failure` categories only.
- Uncertainty handling applies to `ambiguous` and `incomplete` categories only.
- Baseline = single direct LLM call with no agent pipeline or tools.
