import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AboutPage, { metadata } from "@/app/about/page";

describe("About & disclaimers page", () => {
  const html = renderToStaticMarkup(AboutPage());

  it("states the core disclaimers", () => {
    expect(html).toContain("Not medical advice");
    expect(html).toContain("Nutrition and prices are estimates");
    expect(html).toContain("Allergen filtering is best-effort");
    expect(html).toContain("not affiliated with, endorsed by");
  });

  it("uses an accessible heading structure", () => {
    expect(html).toContain("<h1");
    expect(html.match(/<section\b/g)).toHaveLength(5);
    expect(html).toContain('id="main-content"');
  });

  it("exposes shareable metadata", () => {
    expect(metadata.title).toBe("About & disclaimers");
  });
});
