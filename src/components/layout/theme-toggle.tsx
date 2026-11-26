import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { cn } from "cn";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

const TOGGLE_SCRIPT = `
(() => {
  const key = 'snackers-theme';
  if (!window.__snackersThemeToggleReady) {
    window.__snackersThemeToggleReady = true;
    const colors = { light: '#faf4e8', dark: '#121713' };
    const apply = (value) => {
      const dark = value === 'dark' || (value === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
      const color = colors[dark ? 'dark' : 'light'];
      document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
        meta.content = color;
      });
    };
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-theme-choice]');
      if (!target) return;
      const value = target.dataset.themeChoice;
      try { localStorage.setItem(key, value); } catch {}
      apply(value);
      document.querySelectorAll('[data-theme-choice]').forEach((item) => {
        item.setAttribute('aria-checked', String(item.dataset.themeChoice === value));
      });
      target.closest('details')?.removeAttribute('open');
    });
  }
  let saved = 'system';
  try { saved = localStorage.getItem(key) || 'system'; } catch {}
  document.querySelectorAll('[data-theme-choice]').forEach((item) => {
    item.setAttribute('aria-checked', String(item.dataset.themeChoice === saved));
  });
})();
`;

/** A dependency-free theme menu; no client runtime is needed on public pages. */
export function ThemeToggle() {
  return (
    <details className="relative">
      <summary
        aria-label="Change colour theme"
        className={cn(
          "inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden",
        )}
      >
        <SunIcon aria-hidden="true" className="size-4" />
      </summary>
      <div
        role="menu"
        aria-label="Theme"
        className="absolute right-0 z-50 mt-2 min-w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
      >
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Theme</p>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="menuitemradio"
            aria-checked="false"
            data-theme-choice={value}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </button>
        ))}
      </div>
      <script dangerouslySetInnerHTML={{ __html: TOGGLE_SCRIPT }} />
    </details>
  );
}
