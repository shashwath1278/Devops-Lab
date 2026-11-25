# Individual reflection

I tested Student Hub on one machine, with the API on port 8000 and the site on port 3000, and I kept the portfolio as a record of that run rather than a description of tests I meant to run later.

The useful split was between the technique and the tool. Equivalence classes, boundaries, the decision table, and the state change are about how the input was chosen. Schemathesis, Taiko, CrossHair, and Vegeta only executed those choices. Putting "black box" or "performance" on a heading hid that. Once each case had one technique, the OpenAPI check became a second oracle on the API cases, which is why a correct 401 still counts as a failed case.

Three limits are worth keeping in the report. The Supabase host did not resolve, so the library and the study routes never got past DNS, and I did not turn those 500s into a story about bad document ids. CrossHair did not finish the digits 0–9, and I left that case inconclusive instead of calling it a pass. The equal-password column and a real successful login were not run, so they are written as not run.

The Gauge process on this PC did not stay reliable. The scenarios still passed when each one opened its own Chrome window and the wrong-password check waited for the text. That wait matters: the 401 is immediate, and the sentence on the page arrives after it. A check that reads the page too early reports a defect the product does not have.
