# Basis path testing

**Function:** `_pick_matching_document`  
**V(G):** 14, from the 13 predicates in `Control_Flow_Graph/CFG_Document_Matching.md`  
**Tool:** CrossHair 0.0.114, contracts in `testing/whitebox/contracts.py`

A basis set has one independent path per unit of complexity. The seven contracts encode seven of those paths. The other seven are independent paths through the same function that this run did not execute. They are listed so the basis is complete on paper and the gap is visible.

## Paths that were executed

| Path | Predicates that define it | Contract | Expected | Result |
|---|---|---|---|---|
| BP-01 | `_unit_numbers("explain unit 2")` returns `{"2"}` | `unit_two_is_extracted` | extracted id `"2"` | Confirmed |
| BP-02 | P2 true, P4 false for the only file (unit 2 vs unit 3), then return None | `different_units_do_not_match` | nothing selected | Confirmed |
| BP-03 | P1 true | `empty_library_matches` | nothing selected | Confirmed |
| BP-04 | P2 true, digits 0–9, select only when the digits are equal | `same_single_digit_unit` | match iff the digits are equal | Not confirmed. No counterexample. Search unfinished |
| BP-05 | token `unit` dropped inside `_keywords` | `bare_unit_is_a_keyword` | `unit` not in the keyword set | Confirmed |
| BP-06 | P2 false, overlap 1, P13 false | `one_content_word_does_not_match` | nothing selected | Confirmed |
| BP-07 | P2 false, overlap 2, P13 true | `two_content_words_match` | that document selected | Confirmed |

CrossHair reports "Confirmed" when every explored path kept the postcondition. "Not confirmed" on BP-04 means the solver stopped before it had covered the digit domain. It does not mean a failing pair was found.

## Independent paths not executed

These paths are required by V(G) = 14 and were not given a contract in this run.

| Path | Predicates | Expected outcome | Status |
|---|---|---|---|
| BP-08 | P5 false, P6 true: two files both contain unit 2 | The file with the longer title is returned | Not run |
| BP-09 | P2 false, P7 true: message is only stopwords, for example `"please tell me"` | None | Not run |
| BP-10 | P9 true: a document row has a blank title | That row is skipped | Not run |
| BP-11 | P10 true: the full title string occurs inside the question | That document is returned immediately | Not run |
| BP-12 | P11 contributes a tag that supplies the second overlapping word | Selected because of the tag, not the title alone | Not run |
| BP-13 | P12 false on the first document, P12 true on a later one | The later document wins | Not run |
| BP-14 | P3 iterates more than one document and only the second intersects | The second document is the only candidate | Not run |

## Smallest set a viva can walk

1. Empty library returns None (BP-03).
2. A unit number that no title shares returns None (BP-02).
3. One shared content word returns None (BP-06).
4. Two shared content words returns the document (BP-07).
5. The word `unit` cannot by itself become a keyword (BP-05).
