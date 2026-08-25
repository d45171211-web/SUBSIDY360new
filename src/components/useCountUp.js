import { useState, useEffect } from "react";

/* Animated number counter used by the Overview stat cards. */
export function useCountUp(target, dur = 1400, run = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf, t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / dur, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur, run]);
  return v;
}
