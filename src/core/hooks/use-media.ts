import { useState, useEffect } from "react";

export function useMedia(query: string, defaultState: boolean = false) {
  const [matches, setMatches] = useState(defaultState);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}
