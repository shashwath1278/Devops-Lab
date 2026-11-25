# Team learning reflection

**Team:** Shashwath Prabhu (1MS23IS113), Roshan Sharma (1MS23IS104), Saravanan S (1MS23IS112)

The group tested Student Hub on one machine, with the API on port 8000 and the site on port 3000, and kept the portfolio as a record of that run rather than a description of tests meant to be run later.

Shashwath Prabhu took the test analyst role: requirements, the test plan, and the black-box write-ups. Roshan Sharma took the test engineer role: the control-flow graph, basis paths, API results, and the defect report. Saravanan S took automation and QA: the Taiko scenarios, the final report, and the portfolio documentation.

The useful split was between the technique and the tool. Equivalence classes, boundaries, the decision table, and the state change are about how the input was chosen. Schemathesis, Taiko, CrossHair, and Vegeta only executed those choices. Putting "black box" or "performance" on a heading hid that. Once each case had one technique, the OpenAPI check became a second oracle on the API cases, which is why a correct 401 still counts as a failed case.

Three limits are worth keeping in the report. The Supabase host did not resolve, so the library and the study routes never got past DNS, and those 500s were not turned into a story about bad document ids. CrossHair did not finish the digits 0–9, and that case stays inconclusive. The equal-password column and a real successful login were not run, so they are written as not run.

The Gauge process on this PC did not stay reliable. The scenarios still passed when each one opened its own Chrome window and the wrong-password check waited for the text. That wait matters: the 401 is immediate, and the sentence on the page arrives after it. A check that reads the page too early reports a defect the product does not have.
