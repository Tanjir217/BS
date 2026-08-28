import { useEffect } from "react";

function useAutoAdvance({
  enabled = true,
  isPaused = false,
  onAdvance,
  interval = 4000,
}) {
  useEffect(() => {
    if (!enabled || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      onAdvance();
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, isPaused, onAdvance, interval]);
}

export default useAutoAdvance;