Fix B — APP_INITIALIZER defensive guard for platform classes

Goal

Provide a minimal, defensive change you can apply if Fix A (changing `--overflow` on iOS) does not fully resolve scrolling issues. This guard prevents calling `document.body.classList.add(...)` with an empty array and adds a short debug line to help diagnose platform detection at bootstrap.

Recommended patch (apply only if needed)

Replace in `src/main.ts` the line:

```ts
    document.body.classList.add(...platformClasses);
```

with this guarded version:

```ts
    // Defensive: only add classes if PlatformService returned non-empty classes.
    // This avoids calling classList.add() with no args (which could cause
    // runtime issues) and surfaces detection output in console during testing.
    if (platformClasses && platformClasses.length > 0) {
      document.body.classList.add(...platformClasses);
    } else {
      console.debug('PlatformService returned no classes at bootstrap:', platformClasses);
    }
```

Rationale

- Keeps `APP_INITIALIZER` behavior intact while preventing a potential runtime edge-case
  where `classList.add()` is invoked with no arguments.
- Adds a lightweight debug message you can remove after verification.

How to apply

- If Fix A resolves your problem, you don't need to apply this.
- If not, open `src/main.ts`, make the small replacement above, and re-run the app.

Notes

- This change is defensive only and does not alter platform detection logic — it only
  avoids a possible bootstrap-time error and makes platform detection visible in console.
- No other files need to change for this guard.
