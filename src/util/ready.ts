/**
 * Triggers on document ready
 * @param {() => void} fn Callback function
 */
export function ready(fn: () => void): void {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}
