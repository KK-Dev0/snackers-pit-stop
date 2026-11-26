import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");

const FORM_FILES = [
  "src/app/onboarding/page.tsx",
  "src/components/stores/pincode-field.tsx",
  "src/components/stores/store-picker.tsx",
  "src/components/stores/availability-toggle.tsx",
  "src/components/pantry/pantry-manager.tsx",
  "src/components/recipes/import-review-form.tsx",
  "src/components/recipes/import-panel.tsx",
  "src/components/recipes/photo-import-button.tsx",
  "src/app/(app)/me/page.tsx",
];

describe("form input autofill attributes", () => {
  it("gives every form control in the audited screens an id and a name", () => {
    for (const file of FORM_FILES) {
      const code = source(file);
      const controls = code.match(/<(?:Input|input|Textarea|Checkbox|Switch)\b[\s\S]*?\/>/g) ?? [];
      expect(controls.length, file).toBeGreaterThan(0);
      for (const control of controls) {
        expect(control, `${file}: ${control}`).toMatch(/\bid=/);
        expect(control, `${file}: ${control}`).toMatch(/\bname=/);
      }
    }
  });

  it("names profile and pincode fields after their purpose", () => {
    const onboarding = source("src/app/onboarding/page.tsx");
    expect(onboarding).toContain('name="servings"');
    expect(onboarding).toContain('name="calorieGoal"');
    expect(onboarding).toContain('name="weeklyBudgetInr"');
    expect(onboarding).toContain('name="dislikes"');
    expect(source("src/components/stores/pincode-field.tsx")).toContain("name={id}");
  });
});
