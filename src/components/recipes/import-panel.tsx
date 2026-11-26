"use client";

import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Link2Icon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeDraftSchema, type RecipeDraft } from "@/lib/schemas";

const ImportReviewForm = dynamic(
  () => import("@/components/recipes/import-review-form").then((m) => m.ImportReviewForm),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-xl" /> },
);

const PhotoImportButton = dynamic(
  () => import("@/components/recipes/photo-import-button").then((m) => m.PhotoImportButton),
  { ssr: false, loading: () => <Skeleton className="h-10 w-32 rounded-lg" /> },
);

type SourceType = "url" | "photo" | "llm";
type Pending = { kind: "url"; url: string } | { kind: "photo" } | null;

function errorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === "object" && "error" in json && typeof json.error === "string") {
    return json.error;
  }
  return fallback;
}

/** Single import surface: URL or photo in, review-and-save out. */
export function ImportPanel({ photoEnabled }: { photoEnabled: boolean }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ value: RecipeDraft; source: SourceType } | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const importUrl = async (value: string) => {
    const trimmed = value.trim();
    setError(null);
    setSavedTitle(null);
    setPending({ kind: "url", url: trimmed });

    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Enter a full http:// or https:// link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const json: unknown = await response.json();
      if (!response.ok) {
        setError(errorMessage(json, "Could not import that link."));
        return;
      }

      const parsed =
        json && typeof json === "object" && "draft" in json
          ? RecipeDraftSchema.safeParse(json.draft)
          : null;
      if (!parsed?.success) {
        setError("That page did not contain a complete recipe. Try another link.");
        return;
      }

      const method =
        json && typeof json === "object" && "method" in json && json.method === "llm"
          ? "llm"
          : "url";
      setDraft({ value: parsed.data, source: method });
    } catch {
      setError("Could not reach the import service. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void importUrl(url);
  };

  const retry = () => {
    if (!pending) {
      setError(null);
      return;
    }
    if (pending.kind === "url") void importUrl(pending.url);
    else setError(null);
  };

  const acceptPhoto = (value: RecipeDraft) => {
    setPending({ kind: "photo" });
    setError(null);
    setSavedTitle(null);
    setDraft({ value, source: "photo" });
  };

  return (
    <section
      aria-labelledby="import-heading"
      className="space-y-4 rounded-2xl border bg-card/60 p-5"
    >
      <div className="space-y-1">
        <h2 id="import-heading" className="font-display text-xl font-semibold">
          Import a recipe
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheckIcon className="size-4" aria-hidden="true" />
          Review before saving — nothing is stored until you confirm.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="import-url">Recipe link</Label>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Link2Icon
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="import-url"
                type="url"
                inputMode="url"
                placeholder="https://example.com/my-recipe"
                value={url}
                className="pl-9"
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading && pending?.kind === "url" ? "Importing…" : "Import from link"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            We fetch the page, read structured recipe data first, and ask a model only if needed.
          </p>
        </div>
      </form>

      {photoEnabled ? (
        <div className="border-t pt-4">
          <PhotoImportButton enabled onDraft={acceptPhoto} />
        </div>
      ) : null}

      {loading && pending?.kind === "url" ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <p className="text-xs text-muted-foreground">Reading the page and checking the recipe…</p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
        >
          <p className="text-sm text-destructive">{error}</p>
          {pending ? (
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              <RotateCcwIcon aria-hidden="true" /> Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {savedTitle ? (
        <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          “{savedTitle}” was saved to My imports on this device.
        </p>
      ) : null}

      {draft ? (
        <ImportReviewForm
          draft={draft.value}
          sourceType={draft.source}
          onCancel={() => setDraft(null)}
          onSaved={() => {
            setSavedTitle(draft.value.title);
            setDraft(null);
            setUrl("");
          }}
        />
      ) : null}
    </section>
  );
}
