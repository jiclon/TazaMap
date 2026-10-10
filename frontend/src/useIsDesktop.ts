import { useEffect, useState } from "react";

// true, если экран широкий (компьютер или планшет боком)
const QUERY = "(min-width: 900px)";

export function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return desktop;
}
