"use client";

import { useRef, useState } from "react";
import { CameraIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/import-constants";
import { RecipeDraftSchema, type RecipeDraft } from "@/lib/schemas";

/** Rendered only when PHOTO_IMPORT_ENABLED is true on the server. */
export function PhotoImportButton({
  enabled,
  onDraft,
}: {
  enabled: boolean;
  onDraft?: (draft: RecipeDraft) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const pickPhoto = () => inputRef.current?.click();

  const upload = async (file: File) => {
    setMessage(null);
    if (!ALLOWED_IMAGE_TYPES.some((type) => type === file.type.toLowerCase())) {
      setMessage({ text: "Use a JPEG, PNG, WebP or GIF image.", error: true });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ text: "Images must be 5 MB or smaller.", error: true });
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch("/api/import/photo", { method: "POST", body: form });
      const json: unknown = await response.json();
      if (!response.ok) {
        const text =
          json && typeof json === "object" && "error" in json && typeof json.error === "string"
            ? json.error
            : "Could not read that photo.";
        setMessage({ text, error: true });
        return;
      }

      const draft =
        json && typeof json === "object" && "draft" in json
          ? RecipeDraftSchema.safeParse(json.draft)
          : null;
      if (!draft?.success) {
        setMessage({ text: "That extraction was incomplete. Try another photo.", error: true });
        return;
      }

      setMessage({
        text: `Found “${draft.data.title}”. Review the details before saving.`,
        error: false,
      });
      onDraft?.(draft.data);
    } catch {
      setMessage({ text: "Could not reach the import service.", error: true });
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="sr-only"
        aria-label="Choose a recipe photo"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button type="button" variant="outline" onClick={pickPhoto} disabled={busy}>
        <CameraIcon aria-hidden="true" />
        {busy ? "Reading photo…" : "Import from photo"}
      </Button>
      {message ? (
        <p
          role={message.error ? "alert" : "status"}
          className={`text-sm ${message.error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
