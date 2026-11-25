# Boundary value analysis

These cases sit on the edge of a numeric rule. A typical member of the class is an equivalence-class case, not a boundary case.

The rules under test are in `backend/app/api/chat.py`:

- Library length: the bottom is 0 (`if not documents`)
- Keyword overlap: accept when `best_score >= 2`, so 1 is just below and 2 is the first accepted count
- Unit digits: the contract domain is 0 through 9, so the ends are 0 and 9

| ID | Boundary | Input | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| WB-03 | Library size 0 | Any message, document list `[]` | Nothing selected | CrossHair confirmed `_ == False` | Pass |
| WB-06 | Overlap 1 | One shared content word, title also contains "handbook" | Nothing selected | Confirmed | Pass |
| WB-07 | Overlap 2 | Two shared content words | That document is selected | Confirmed | Pass |
| WB-04 | Digits 0 and 9, and every digit between them | `unit N` against title `unit M` for N, M in 0..9 | Match only when N = M | No counterexample. Search did not finish | Inconclusive |

WB-06 uses the words photosynthesis, mitosis, and algebra, one at a time. The extra word "handbook" is only in the title, so the overlap stays at 1.

WB-07 uses the pairs (photosynthesis, mitosis) and (algebra, calculus). Both words appear in the question and in the title, so the overlap is 2.

The just-above-threshold value 3 was not given its own case. The rule is `>= 2`, so 2 is the boundary that must flip the result, and 3 would belong to the same accepted class.
