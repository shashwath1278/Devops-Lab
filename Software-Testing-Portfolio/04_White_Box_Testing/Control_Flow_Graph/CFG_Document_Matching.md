# Control flow graph — document matching

**Function:** `_pick_matching_document` in `backend/app/api/chat.py`  
**Lines:** 50–104  
**Related helpers:** `_unit_numbers` (line 45), `_keywords` (line 40)

`_unit_numbers` is one regular expression and has no branch of its own. `_keywords` drops tokens inside the set comprehension (`len(t) > 1`, not a stopword, not the token `unit`). The graph below is the matcher, which is where the paths diverge.

## Predicate list

Each predicate is a decision node. Cyclomatic complexity is the number of predicates plus one.

| # | Predicate | Line |
|---|---|---|
| P1 | `not documents` | 55 |
| P2 | `msg_units` is non-empty | 61 |
| P3 | unit loop: another document remains | 63 |
| P4 | `msg_units & doc_units` | 66 |
| P5 | `len(candidates) == 1` | 68 |
| P6 | `len(candidates) > 1` | 70 |
| P7 | `not msg_words` | 75 |
| P8 | keyword loop: another document remains | 81 |
| P9 | `not title` | 83 |
| P10 | `title_lower in msg_lower` | 87 |
| P11 | tag loop: another tag remains | 92 |
| P12 | `overlap > best_score` | 96 |
| P13 | `best_score >= 2` | 100 |

**V(G) = 13 + 1 = 14**

## Graph

```text
                 [entry]
                    |
                   P1 empty library?
                  /    \
               yes      no
               |         |
          return None    P2 message names a unit?
                        /            \
                     yes              no
                      |                |
                     P3 scan titles   P7 no content words?
                     P4 intersection /        \
                      |          yes           no
                     P5 one candidate?    return None
                    /        \
                 yes          no
                 |             |
            return it         P6 more than one?
                             /            \
                          yes              no
                          |                |
                   return longest      return None
                   title

        keyword side, after P7 is no:

                     P8 scan documents
                     P9 skip blank title
                     P10 exact title inside the question? --yes--> return it
                     P11 fold tags into the word set
                     P12 keep the doc if overlap beats the best
                     P13 best >= 2? --yes--> return best
                                 \--no---> return None
```

## What each exit means

| Exit | Condition |
|---|---|
| None, empty library | P1 true |
| The single unit file | P2 true, exactly one title shares a unit number |
| The longest of several unit files | P2 true, two or more titles share a unit number |
| None, wrong unit | P2 true, no title shares the asked unit |
| None, only stopwords | P2 false and the keyword set is empty |
| The document whose title is a substring of the question | P10 true |
| The highest-scoring document | overlap at least 2 |
| None, overlap 0 or 1 | P13 false |
