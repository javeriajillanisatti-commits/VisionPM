import { useEffect, useRef, useState } from "react";

// Animate value to target
const useCountUp = (targetValue, duration = 1000) => {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = parseFloat(targetValue);

    // Show non-numeric values directly
    if (isNaN(target)) {
      setDisplayValue(targetValue);
      return;
    }

    let start;

    // Update animation frame
    const step = timestamp => {
      start ??= timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(eased * target));

      if (progress < 1)
        rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    // Cancel animation on cleanup
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, duration]);

  return displayValue;
};

export default useCountUp;