import { useEffect, useState } from "react";

// False on the server and during the first client render, true afterwards. Lets
// time-dependent text match the pre-rendered HTML first, then update in the browser.
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
