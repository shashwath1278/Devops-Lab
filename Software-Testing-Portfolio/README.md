# Software Testing Portfolio — Student Hub

**Subject:** Software Testing  
**Activity:** Online Portfolio on GitHub  
**Marks:** 20  
**Repository:** [Devops-Lab](https://github.com/shashwath1278/Devops-Lab)  
**Date of execution:** 25 November 2026

This is a group portfolio for three students. The folder layout follows the course portfolio: requirements, test plan, black-box techniques, white-box analysis, API testing, automation, defect reports, a final report, evidence, and a team reflection.

| Student | USN | Role |
|---|---|---|
| Shashwath Prabhu | 1MS23IS113 | Test analyst. Requirements, test plan, black-box cases |
| Roshan Sharma | 1MS23IS104 | Test engineer. White-box analysis, API results, defect reports |
| Saravanan S | 1MS23IS112 | Automation and QA. UI automation, final report, portfolio documentation |

## Application under test

Student Hub is a study desk. A student registers, signs in, uploads a PDF or text file, searches a shared library, and asks an assistant about a matching file. The same file can be turned into flashcards or a quiz.

| Item | Detail |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, port 3000 |
| Backend | FastAPI, Python 3.11, port 8000 |
| Documents | Supabase Postgres table `public.documents`, Storage bucket `textbooks` |
| Model | Groq, called from `backend/app/services/gemini.py` |
| Session | NextAuth credentials, JWT, 30 days |

## What was run

| Technique | Tool | Result in one line |
|---|---|---|
| Equivalence class partitioning | Schemathesis, Taiko, CrossHair | 6 pass, 2 fail (the handler is right, the OpenAPI file omits 400/401) |
| Boundary value analysis | CrossHair | 3 pass, 1 inconclusive |
| Decision table | Taiko | Unequal passwords pass. Equal passwords were not run |
| State transition | Taiko | Register page to sign-in page, pass |
| Adversarial | Schemathesis, CrossHair | Unit mismatch pass. Upload and delete without a token return 401, which the spec omits |
| Error guessing | Schemathesis | List, chat, flashcards, and quiz return 500 because the Supabase host does not resolve |
| Basis path / contracts | CrossHair | 6 contracts confirmed, 1 search unfinished |
| Load | Vegeta | Health endpoint pass. Document list fail |

**23 cases. 13 passed, 9 failed, 1 inconclusive.**

A failure here is a disagreement with the oracle that was declared before the run. Four of the API failures are missing status codes in the OpenAPI file. Four are the unreachable Supabase host. One is the document list under load.

## Folder map

```text
Software-Testing-Portfolio/
├── README.md
├── 01_Requirements/Requirements_Analysis.md
├── 02_Test_Plan/Test_Plan.md
├── 03_Black_Box_Testing/
│   ├── Equivalence_Class_Partitioning.md
│   ├── Boundary_Value_Analysis.md
│   ├── Decision_Table_Testing.md
│   └── State_Transition_Testing.md
├── 04_White_Box_Testing/
│   ├── Control_Flow_Graph/CFG_Document_Matching.md
│   ├── Basis_Path_Testing.md
│   └── Coverage_Report.md
├── 05_API_Testing/API_Test_Results.md
├── 06_Automation_Testing/README.md
├── 07_Defect_Reports/Bug_Report.md
├── 08_Test_Reports/Final_Test_Report.md
├── 09_Evidence/
│   ├── screenshots/README.md
│   └── videos/README.md
└── reflections/Team_Learning_Reflection.md
```

The runnable scripts stay in `testing/`, which this portfolio cites. `testing/ST-TEST-REPORT.md` is the same execution, grouped by technique.
