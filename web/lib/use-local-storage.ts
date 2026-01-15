import { useEffect, useRef, useState } from "react";

export function useLocalStorageBoolean(key: string, defaultValue: boolean) {
  const [value, setValue] = useState<boolean>(defaultValue);
  const hasHydrated = useRef(false);
  const skipNextWrite = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return;
      const next = raw === "true";
      if (next !== value) {
        skipNextWrite.current = true;
        queueMicrotask(() => setValue(next));
      }
    } catch {
      // ignore storage errors (private mode, blocked, etc.)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, value ? "true" : "false");
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}


