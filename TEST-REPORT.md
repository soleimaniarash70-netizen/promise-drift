# Verification — 2026-09-12

- TypeScript 5.5.4 with powerbi-visuals-api 5.11.1: PASS.
- SDK 7.2.1 package (minified and compressed): PASS.
- SDK default lint: PASS.
- Eight domain tests: PASS (sorting, first-promise baseline, duplicate snapshots, early/on-time, reversal, conflicts, supplier key, Persian display, invalid calendar dates).
- Browser tests on JS/CSS extracted from the generated pbiviz: PASS. Uses the real bundled formatting utility and a simulated Power BI selection host.
- Four sample orders render; selecting PO-1042 selects 3 snapshot identities; selecting Pars Steel selects 4 snapshot identities and 2 order cards; clear removes selection.
- Formatting model contains two switches; switching RTL and calendar renders correctly; 420px viewport checked; zero browser errors.
- Package contains manifest, capabilities, icon and compiled JS/CSS resource.

Not tested: import and cross-visual filtering inside real Power BI Desktop/Service; AppSource certification. SDK emits optional-feature recommendations for context menu, host palette/high contrast, highlight data, localization resources, tooltips, landing page and allowInteractions. These are not package build errors. English status labels coexist with Persian UI labels. The initial design could not be compared to the missing approved mockup.


## 1.0.1 — Data binding fix

Removed simultaneous minimum-field conditions from dataViewMappings. Power BI permits at most one role with a positive minimum per condition. Fields can now be bound incrementally in any order; the visual itself checks the four required roles before rendering. Added a regression test. Nine tests pass. The corrected package has not yet been verified inside Power BI Desktop.
