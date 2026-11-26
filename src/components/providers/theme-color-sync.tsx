const THEME_SCRIPT = `
(() => {
  const key = 'snackers-theme';
  const colors = { light: '#faf4e8', dark: '#121713' };
  const apply = (value) => {
    const dark = value === 'dark' || (value === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    const color = colors[dark ? 'dark' : 'light'];
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.content = color;
    });
    document.querySelectorAll('[data-theme-choice]').forEach((item) => {
      item.setAttribute('aria-checked', String(item.dataset.themeChoice === value));
    });
  };
  const read = () => {
    try { return localStorage.getItem(key) || 'system'; } catch { return 'system'; }
  };
  apply(read());
  window.addEventListener('storage', (event) => {
    if (event.key === key) apply(event.newValue || 'system');
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (read() === 'system') apply('system');
  });
})();
`;

/**
 * Applies the saved theme before paint with a tiny inline script. Keeping this
 * out of React means the public landing page ships no client runtime.
 */
export function ThemeColorSync() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
