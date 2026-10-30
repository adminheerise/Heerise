# Career Simulation: Frontend Progress

Built on main and the existing hardcoded demo. API contracts, live AI, Email gate, token handling, and History integration are outside this change.

## Implemented

- Scenario bar during Simulation: collapsed by default, expandable, and sticky below the navbar.
- Navbar offset updates with its height; expanded details scroll internally.
- The bar is removed when leaving Simulation and rebuilt on retry or scenario changes.
- Validation for empty JD, empty replies, and sessionStorage write failures; editing clears the error.
- Loading state and duplicate transition protection.
- Replies rendered as plain text.

## Component Interface

`static/js/career-sim/ui.js` handles presentation only. The future integration layer maps API data into this internal display model; this is not a backend contract:

```js
const bar = CareerSimUI.scenarioBar({
  title: "Scenario title",
  summary: "Short task summary",
  details: [{ label: "Your goal", text: "Task details" }]
});
container.before(bar);
```

The caller supplies an internal error type. HTTP status and backend error mappings are not implemented yet:

```js
CareerSimUI.showError(host, "NETWORK", {
  actionLabel: "Try again",
  onAction: retry,
  focus: true
});
CareerSimUI.clearError(host);
```

Error types: EMPTY_JD / EMPTY_MESSAGE / STORAGE / CONTENT_BLOCKED /
SESSION_EXPIRED / RATE_LIMITED / UNAVAILABLE / NETWORK / UNKNOWN.
The future API integration layer supplies session renewal and retry actions.

## Validation

- Hugo v0.168.0 build passed; existing languageCode deprecation warnings remain.
- Browser checks: empty JD, valid JD navigation, empty reply, and recovery after editing.
- Expand/collapse, sticky positioning during long conversations, removal on self-assessment/debrief, and title updates after scenario changes.
- No horizontal overflow at 390px width; scrolled bar top was 83px, navbar bottom approximately 82.4px.
- `<b>` test input displayed as plain text.

Pending integration checks: real API errors, session renewal, rate-limit wait behavior, duplicate prevention on retries, and disabled browser storage.
