"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  geolocationErrorCode,
  geolocationErrorMessage,
  isPincode,
  normalizePincode,
  OSM_ATTRIBUTION,
} from "@/lib/geo";
import { GeoLocationSchema, type GeoLocation } from "@/lib/schemas/geo";

type PincodeFieldProps = {
  value: string;
  onChange: (pincode: string) => void;
  id?: string;
  /** Hide the optional geolocation button on screens where manual entry is preferred. */
  manualOnly?: boolean;
};

/**
 * Manual pincode entry is always available; "Use my location" is opt-in and
 * converts coordinates to a pincode on the server. Coordinates stay in memory
 * for that single request and are never stored.
 */
export function PincodeField({
  value,
  onChange,
  id = "pincode",
  manualOnly = false,
}: PincodeFieldProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState<GeoLocation | null>(null);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const handleManualChange = (raw: string) => {
    const next = normalizePincode(raw).slice(0, 6);
    setError(null);
    setPlace(null);
    onChange(next);
  };

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError(geolocationErrorMessage("unsupported"));
      return;
    }

    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Coordinates are used only for this request, then discarded.
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch("/api/geo/reverse", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ lat: latitude, lon: longitude }),
          });
          const payload: unknown = await response.json();
          if (!response.ok) {
            const code =
              typeof payload === "object" && payload !== null && "code" in payload
                ? String((payload as { code: unknown }).code)
                : "provider_error";
            if (code === "not_supported") {
              setError("We could not find an Indian pincode near you. Enter it manually.");
            } else {
              setError("Location lookup failed. Enter your pincode instead.");
            }
            return;
          }
          const parsed = GeoLocationSchema.safeParse(payload);
          if (!parsed.success) {
            setError("Location lookup failed. Enter your pincode instead.");
            return;
          }
          setPlace(parsed.data);
          setError(null);
          onChange(parsed.data.pincode);
        } catch {
          setError(geolocationErrorMessage("unavailable"));
        } finally {
          setLocating(false);
        }
      },
      (positionError) => {
        setError(geolocationErrorMessage(geolocationErrorCode(positionError)));
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const invalid = value.length > 0 && !isPincode(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Pincode</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name={id}
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="e.g. 713301"
          value={value}
          aria-invalid={invalid || error !== null}
          aria-describedby={invalid || error ? `${errorId} ${hintId}` : hintId}
          onChange={(event) => handleManualChange(event.target.value)}
        />
        {!manualOnly && (
          <Button
            type="button"
            variant="outline"
            onClick={locate}
            disabled={locating}
            aria-label="Use my location"
          >
            <MapPin aria-hidden="true" className="size-4" />
            {locating ? "Locating…" : "Use my location"}
          </Button>
        )}
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        We keep only your pincode, never your coordinates.
      </p>
      {invalid && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          Enter a valid 6-digit Indian pincode.
        </p>
      )}
      {!invalid && error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {place && !error && (
        <p role="status" className="text-sm text-accent">
          Near {place.city ?? place.state ?? place.pincode}, {place.pincode}. Location data:{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {OSM_ATTRIBUTION}
          </a>
        </p>
      )}
    </div>
  );
}
