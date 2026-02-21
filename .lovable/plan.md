

## Fix: Navigation Filter Links Not Visibly Working

### Problem
When clicking "Middle East Focus", "Hyperscale", or "Sustainability" in the header navigation:
1. The filter IS being applied behind the scenes, but the page does not scroll down to the news section -- so it appears nothing happened.
2. `e.preventDefault()` blocks the browser's native scroll-to-anchor (`/#news`) behavior.
3. When navigating from a different page (e.g., `/leaders`) back to `/`, the 100ms delay before dispatching the filter event may fire before the Index component mounts and registers its listener.

### Solution

**File: `src/components/Header.tsx`**

After dispatching the `nav-filter` event, programmatically scroll to the `#news` section so the user sees the filtered results. Also increase the timeout when navigating from another page to ensure the Index component has mounted.

Changes to the desktop nav `onClick` handler (around line 120-134):

```typescript
onClick={(e) => {
  e.preventDefault();
  setActiveLink(link.label);
  if (link.filter !== null) {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("nav-filter", { detail: link.filter }));
        document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
      }, 300); // increased from 100ms to 300ms
    } else {
      window.dispatchEvent(new CustomEvent("nav-filter", { detail: link.filter }));
      document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
    }
  } else {
    navigate(link.href);
  }
}}
```

Apply the same fix to the mobile nav `onClick` handler (around line 179-195).

### Summary of Changes
- Add `scrollIntoView` after dispatching the filter event so the news section becomes visible
- Increase navigation timeout from 100ms to 300ms to ensure the page mounts before the event fires
- Apply to both desktop and mobile navigation handlers
- No UI or functionality changes beyond this fix

