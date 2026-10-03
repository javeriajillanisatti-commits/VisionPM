import { useCallback, useEffect, useRef, useState } from "react";
export const LIVE_EVENT = "app:data-changed";

export const useLiveTick = ({
  resources,
  debounceMs = 400,
  ignoreOwn = false,
  currentUserId = null,
} = {}) => {
  const [tick, setTick] = useState(0);
  const timer = useRef(null);
  const resourcesKey = resources ? resources.join(",") : "";

  useEffect(() => {
    const allowed = resourcesKey ? resourcesKey.split(",") : null;

    const onChange = (e) => {
      const d = e.detail || {};
      if (allowed && d.resource && d.resource !== "*" && !allowed.includes(d.resource)) return;
      if (ignoreOwn && currentUserId && d.actorId && d.actorId === String(currentUserId)) return;

      clearTimeout(timer.current);
      timer.current = setTimeout(() => setTick((t) => t + 1), debounceMs);
    };

    window.addEventListener(LIVE_EVENT, onChange);
    return () => {
      window.removeEventListener(LIVE_EVENT, onChange);
      clearTimeout(timer.current);
    };
  }, [resourcesKey, debounceMs, ignoreOwn, currentUserId]);

  return tick;
};
export const useLiveRefresh = (refetch, options) => {
  const tick = useLiveTick(options);
  const ref = useRef(refetch);
  ref.current = refetch;

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    ref.current?.();
  }, [tick]);
};

export const isUserBusy = () => {
  const el = document.activeElement;
  if (el) {
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) {
      if (!(tag === "INPUT" && ["checkbox", "radio", "button", "submit"].includes(el.type))) return true;
    }
  }
  return !!document.querySelector('[role="dialog"], [aria-modal="true"], main .fixed.inset-0');
};

export default useLiveRefresh;
