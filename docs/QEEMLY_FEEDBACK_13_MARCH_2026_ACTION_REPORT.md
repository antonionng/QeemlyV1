    # Qeemly Feedback Action Report
    **Source:** Client feedback (13 March 2026)  
    **Report date:** 18 March 2026  
    **Status:** Updated trace after implementation pass

    ---

    ## Executive Summary

    This report maps each item from the 13 March 2026 client feedback document to the current implementation. Items are classified as **Actioned**, **Partially actioned**, **In progress**, or **Pending**.

    ### Delivered in this pass
    - People page updated with URL-backed band filters, separate Status and Level columns, workspace-currency salary headers, Total/Basic hierarchy, and a condensed market data cell.
    - Overview interactions now open the People page with the relevant band or department context, and the sidebar now uses a dedicated Company section for Market Overview, People, Salary Review, and Integrations.
    - Benchmarks results/detail pages now anchor Back at the top, expose editable search controls directly on the results page, and keep the summary within the standard results flow.

    ---

    ## 1. Overview – Shortcuts & Band Distribution (Page 1)

    ### Feedback
    - **View outside band / Quick actions:** Clicking should automatically filter to the relevant employee segment (e.g. outside band only), not show all employees.
    - **Band distribution:** Make interactive. Clicking a data point (e.g. 71% "in band") should load the **People** page pre-filtered to that segment (In Band, Above Band, Below Band) with a filter at the top to switch between segments.
    - **Formatting:** Align with design (noted as part of the 35% to be completed).

    ### Implementation Status: **Actioned / In progress**

    | Item | Status | Notes |
    |------|--------|-------|
    | Band distribution interactive | ✅ Actioned | Band distribution chart and stat cards are clickable via `OverviewInteractiveSurface`. Clicking In Band, Above Band, or Below Band opens the People page with the matching filter applied. |
    | Pre-filtered destination | ✅ Actioned | Overview band interactions now route to **People** using URL-backed filters such as `?band=in-band`, `?band=above`, `?band=below`, and `?band=outside-band`. |
    | Quick actions filter | ✅ Actioned | Quick actions now carry the relevant band or department context into the People page instead of dropping users into an unfiltered list. |
    | Formatting / design alignment | 🔄 In progress | Core routing and interaction feedback is now addressed. Remaining polish is visual design alignment rather than navigation behaviour. |

    ---

    ## 2. Navigation & Placement (Page 2)

    ### Feedback
    - **Integrations / Market Overview:** Should live in Settings or a new "Company" category in the menu alongside Market Overview and People.
    - **Annual/Monthly toggle:** Remove from top of webpage; it is already present in relevant places and should not be duplicated at top level.
    - **Back button:** Must sit above search filters, not below.
    - **Search filters:** Must be editable so users can run a new search from the top of the page without navigating away.
    - **Global rule:** All "Back" or "Return" buttons should be anchored to the top of their respective pages.

    ### Implementation Status: **Actioned**

    | Item | Status | Notes |
    |------|--------|-------|
    | Navigation structure | ✅ Actioned | Sidebar now groups Market Overview, People, Salary Review, and Integrations inside a dedicated **Company** section. |
    | Annual/Monthly toggle | ✅ Actioned | No duplicate top-level Annual/Monthly toggle is present. Toggles remain only in context-specific surfaces such as Salary Review and Benchmark results. |
    | Back above search / editable filters | ✅ Actioned | Benchmark results now place Back above the search controls and allow edits plus reruns directly from the results page. |
    | Back button anchoring | ✅ Actioned | Audited the affected feedback pages and standardized the benchmark results/detail flows so Back appears before filters/content controls. Existing approval detail already followed this rule. |

    ---

    ## 3. Benchmarks Page (Page 3)

    ### Feedback
    - **Summary placement:** Summary should go below both the table and graphs.
    - **Results box:** Incorporate the "box" shown when benchmark results are run into the current design.

    ### Implementation Status: **Actioned**

    | Item | Status | Notes |
    |------|--------|-------|
    | Summary below table/graphs | ✅ Actioned | Results still render the level table and boxplot before the summary block, matching the requested order. |
    | Results box integration | ✅ Actioned | The benchmark results page now uses the editable search/results layout as the standard flow, with the summary retained as part of the main results experience rather than a detached box. |

    ---

    ## 4. Salary Review (Page 4)

    ### Feedback
    - **Levelling column:** Put levelling into its own column (like captured date) so it can be filtered.
    - **Company Overlay vs Qeemly Market Dataset:** Explain these terms.
    - **Department-level budget splitting:** New workflow option – master review with total budget, allocate per department, departments run siloed workflows, consolidation into master view. Support direct allocation or Finance approval. Present as either/or at cycle initiation.

    ### Implementation Status: **Actioned (department split) / Partial (others)**

    | Item | Status | Notes |
    |------|--------|-------|
    | Department-level budget splitting | ✅ **Actioned** | Full implementation: `review_mode: "department_split"`, master/child cycles, department allocations, direct vs finance approval, approval center, proposal workflow. |
    | Levelling in own column | 🔍 To verify | Salary review workspace and tables; need to confirm level has a dedicated filterable column. |
    | Company Overlay vs Qeemly Market | ✅ **Documented** | See explanation below. |

    ### Company Overlay vs Qeemly Market Dataset – Explanation

    | Term | Meaning |
    |------|---------|
    | **Qeemly Market Dataset** | Platform benchmark data from Qeemly’s aggregated market sources (ingestion, published benchmarks). Used for market positioning and band placement. |
    | **Company Overlay** | Benchmark data uploaded or provided by the customer (e.g. salary survey imports, custom benchmarks). Overlays the company’s own data on top of or alongside the market dataset. |

    Both can contribute to an employee’s benchmark; the UI shows the primary source (e.g. "Qeemly Market Dataset" or "Company Overlay") per employee/benchmark.

    ---

    ## 5. Cost of Living Page (Page 5)

    ### Feedback
    - **Layout:** Same crowding issue as other pages. Resizing bento boxes is not the right fix.
    - **Lewis redesign:** Lewis is redesigning this page; expected by Sunday evening.

    ### Implementation Status: **Pending (design)**

    | Item | Status | Notes |
    |------|--------|-------|
    | Cost of Living layout | 📋 Pending | Awaiting Lewis’s redesign. |
    | Status and level separation | 📋 Pending | To be addressed in redesign. |

    ---

    ## 6. People Segment (Page 5)

    ### Feedback
    - **Salary column:** "Total" should be primary/larger font, "Basic" secondary/smaller.
    - **Status and Level:** Split into separate columns (currently combined) for independent filtering.
    - **Market data column:** Too much information in a single cell; condense or restructure for readability.
    - **Column header:** Show currency label (e.g. "Salary (AED)") from settings; remove currency from each cell to declutter.

    ### Implementation Status: **Actioned**

    | Item | Status | Notes |
    |------|--------|-------|
    | Salary Total/Basic hierarchy | ✅ Actioned | Salary cells now show **Total** as the primary value and **Basic** as the secondary line. |
    | Status and Level separate columns | ✅ Actioned | The People table now splits Status and Level into separate columns for cleaner scanning and future filtering work. |
    | Market data column reformat | ✅ Actioned | Market data is condensed into a clearer comparison + source/match/freshness structure. |
    | Salary column header with currency | ✅ Actioned | Header now uses workspace currency (for example `Salary (AED)`) and individual cells display numbers only for readability. |

    ---

    ## 7. Other Improvements (Beyond Feedback)

    The following have been implemented or improved since the feedback:

    ### Market & Benchmark Infrastructure
    - Market publish API and admin publish workflow
    - Benchmark role mapping and coverage
    - Ingestion source tiers and market pool refresh
    - Benchmark resolver for role/location/level matching
    - Coverage contract and coverage snapshots

    ### Admin & Publish
    - Admin publish page and market publish workflow
    - Role-mapping reviews API
    - Market seed and full-coverage seed script

    ### Marketing & Home
    - New home page (`/home`) with hero, bento grid, services showcase
    - Auth split shell refresh
    - Root route redirect to `/home`

    ### Dashboard & UX
    - Band distribution chart with interactive segments
    - Overview interactions (drawer, links)
    - Integration contact modal
    - Market refresh banner
    - Compensation health score card

    ### Database
    - Migrations for role mapping, source tiers, market publish events, platform pool swap

    ---

    ## Summary Table

    | Category | Actioned | Partial | Pending / In progress |
    |----------|----------|---------|------------------------|
    | Overview shortcuts & band | 3 | 0 | 1 |
    | Navigation & placement | 4 | 0 | 0 |
    | Benchmarks page | 2 | 0 | 0 |
    | Salary Review | 2 | 1 | 0 |
    | Cost of Living | 0 | 0 | 2 |
    | People segment | 4 | 0 | 0 |
    | **Total** | **15** | **1** | **3** |

    ---

    ## Next Steps

    1. **Design dependency:** Cost of Living page – await Lewis’s redesign before implementing the remaining layout feedback there.
    2. **Design polish:** Continue the remaining overview visual alignment work if the team still wants closer parity with the reference screens.
    3. **Validation:** Run the full production build and deployment cycle once this pass is approved for release.

    ---

    *Report generated from codebase trace against Qeemly Feedback 13 March 2026.*
