import { WifiOffIcon } from "lucide-react";

const OFFLINE_SCRIPT = `
(() => {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  const update = () => { banner.hidden = navigator.onLine !== false; };
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
})();
`;

/** Server-rendered banner toggled by a tiny inline script, with no React work. */
export function OfflineBanner() {
  return (
    <>
      <div
        id="offline-banner"
        role="status"
        aria-live="polite"
        hidden
        className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 border-b border-border bg-accent px-4 py-2 text-center text-xs font-medium text-accent-foreground shadow-soft"
      >
        <WifiOffIcon className="size-4 shrink-0" aria-hidden="true" />
        <span>
          Offline — your plan, pantry and list still work. Imports and store votes need a
          connection.
        </span>
      </div>
      <script dangerouslySetInnerHTML={{ __html: OFFLINE_SCRIPT }} />
    </>
  );
}
