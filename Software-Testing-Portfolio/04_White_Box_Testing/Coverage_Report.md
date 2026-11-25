# Coverage report

**Tool that was actually run:** CrossHair 0.0.114 on `testing/whitebox/contracts.py`  
**Command:** `crosshair check --report_all --per_condition_timeout 12 testing/whitebox/contracts.py`  
**Exit code:** 0  
**Raw log:** `testing/results/crosshair.txt`

A line-coverage percentage was not collected. There is no coverage.py or Istanbul number for this run, and this report does not fill one in. What was measured is whether each encoded path kept its postcondition.

## Contract outcomes

| Location | Contract | CrossHair | Reading |
|---|---|---|---|
| unit extraction | post `_ == "2"` | Confirmed | The path held |
| different units | post `_ == False` | Confirmed | The path held |
| empty library | post `_ == False` | Confirmed | The path held |
| digits 0–9 | post `_ == (unit_a == unit_b)` | Not confirmed | Search stopped. No counterexample |
| bare `unit` | post `_ == False` | Confirmed | The path held |
| overlap 1 | post `_ == False` | Confirmed | The path held |
| overlap 2 | post `_ == True` | Confirmed | The path held |

6 of 7 contracts were confirmed. 1 of 7 is inconclusive.

## Basis coverage against V(G) = 14

| | Count |
|---|---|
| Independent paths implied by the control flow graph | 14 |
| Paths encoded as contracts | 7 |
| Paths confirmed | 6 |
| Paths inconclusive | 1 |
| Paths with no contract | 7 |

Path coverage of the basis is 6/14 confirmed. That is the figure to quote. It is not a statement-coverage percentage.

## Predicates exercised at least once

| Predicate | Exercised? |
|---|---|
| P1 empty library | Yes, WB-03 |
| P2 unit number present | Yes, WB-02 |
| P4 intersection empty | Yes, WB-02 |
| keyword filter that drops `unit` | Yes, WB-05 |
| P13 `best_score >= 2` true | Yes, WB-07 |
| P13 false | Yes, WB-06 |
| P5 exactly one unit candidate, across digits 0–9 | Attempted, not finished |
| P6 several unit candidates | No |
| P9 blank title | No |
| P10 exact title substring | No |
| P11 tags change the score | No |

## How to regenerate

From the repository root, with `testing\.venv` installed:

```powershell
testing\.venv\Scripts\crosshair.exe check --report_all --per_condition_timeout 12 testing\whitebox\contracts.py
```
