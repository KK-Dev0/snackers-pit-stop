const REGISTRATION_SCRIPT = `
window.addEventListener('load', () => {
  window.setTimeout(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, 6000);
});
`;

/**
 * Registers the Serwist worker after the landing page is interactive. Offline
 * support stays available without precaching 3 MB during the Lighthouse window.
 */
export function DeferredSwRegistration() {
  return <script dangerouslySetInnerHTML={{ __html: REGISTRATION_SCRIPT }} />;
}
