'use client';
import { useEffect, useRef, useState } from "react";
import { LocationSearch, type Place } from "./LocationSearch";
import { getOffsetLabel, getTimeZoneDisplayName } from "@/lib/time";

// tz-lookup's coordinates→zone dataset is ~29 KB gzipped and only needed once
// a place is picked, so it loads on demand (Oct 2026 audit) — prefetched when
// the field is hovered or focused, so selecting a place doesn't wait on it.
type TzLookup = (lat: number, lon: number) => string;
let tzLookupPromise: Promise<TzLookup> | null = null;
const loadTzLookup = (): Promise<TzLookup> => {
  if (!tzLookupPromise) tzLookupPromise = import("tz-lookup").then((m) => m.default as TzLookup);
  return tzLookupPromise;
};

interface LocationTimezonePickerProps {
  label: string;
  onTimezoneResolved: (iana: string, placeName?: string) => void;
  defaultHint?: string;
  className?: string;
  value?: string; // Allow external control of the input value
  preset?: { lat: number; lon: number } | null; // optional: preset coord to programmatically set (e.g., geolocation button)
  timeZone?: string; // optional: externally control the resolved IANA timezone (e.g., when swapping)
  id?: string; // Add id prop for accessibility
  name?: string; // Add name prop for form handling
  onDisplayChange?: (value: string) => void; // Callback for when display text changes (typing)
}

export function LocationTimezonePicker({
  label,
  onTimezoneResolved,
  defaultHint,
  className = "",
  value,
  preset,
  timeZone,
  id,
  name,
  onDisplayChange,
}: LocationTimezonePickerProps) {
  const [iana, setIana] = useState<string>("");
  const [displayLabel, setDisplayLabel] = useState<string>(""); // shown under the input
  const lastPresetRef = useRef<string>("");

  // When a place is selected from the dropdown
  const handleSelect = async (p: Place) => {
    const zone = (await loadTzLookup())(p.lat, p.lon);
    if (zone) {
      setIana(zone);
      setDisplayLabel(p.name);
      onTimezoneResolved(zone, p.name);
      // nothing else: LocationSearch will close itself and stop searching (dirty=false)
    }
  };

  // Update display when external value changes (like from swap/clear) - higher priority
  // Only sync when external value is explicitly set, don't include displayLabel in deps to avoid loops
  useEffect(() => {
    if (value !== undefined) {
      setDisplayLabel(value);
    }
  }, [value]);

  // Keep internal IANA in sync with external timeZone prop (e.g., after swap/clear)
  useEffect(() => {
    if (timeZone) {
      if (timeZone !== iana) setIana(timeZone);
    } else if (iana) {
      setIana("");
    }
  }, [timeZone, iana]);

  // If parent provides a preset (e.g., "Use my location") - lower priority
  useEffect(() => {
    if (!preset) return;
    const key = `${preset.lat},${preset.lon}`;
    if (key === lastPresetRef.current) return;
    lastPresetRef.current = key;

    // Not cancelled on re-run: lastPresetRef already holds this key, so a
    // re-run returns early and dropping this result would lose the preset.
    void loadTzLookup().then((tzLookup) => {
    const zone = tzLookup(preset.lat, preset.lon);
    
    if (zone) {
      setIana(zone);
      
      // Only set display label if no external value is provided or if it's empty (not from swap)
      const shouldSetLabel = !value || value.trim() === '';
      
      if (shouldSetLabel) {
        const label = `${zone.split('/').pop()?.replace(/_/g, ' ')} (preset)`;
        setDisplayLabel(label);
      }
      
      // Always emit when it's from a preset (geolocation), even if timezone appears the same
      // This ensures the parent component gets notified and can update the display
      const placeName = shouldSetLabel ? `${zone.split('/').pop()?.replace(/_/g, ' ')} (preset)` : undefined;
      onTimezoneResolved(zone, placeName);
      // LocationSearch won't reopen because it re-opens only when focused && dirty
    }
    });
  }, [preset, onTimezoneResolved, value, timeZone]);

  return (
    <div className={className} onPointerEnter={() => void loadTzLookup()} onFocusCapture={() => void loadTzLookup()}>
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-foreground dark:text-foreground uppercase tracking-wide mb-3">
          {label}
        </label>
      )}

      {/* LocationSearch handles the dropdown open/close and stale requests */}
      <LocationSearch
        ariaLabel={`${label || 'Location'} search`}
        placeholder="Type a city…"
        onSelect={handleSelect}
        value={displayLabel}
        id={id}
        name={name}
        onInputChange={(newValue) => {
          setDisplayLabel(newValue);
          onDisplayChange?.(newValue); // Notify parent of display changes
        }}
      />

      <div className="mt-2 min-h-[1.25rem]">
        <div className={`text-xs transition-colors ${
          iana
            ? 'text-primary dark:text-accent font-medium'
            : 'text-muted-foreground dark:text-muted-foreground'
        }`}>
          {iana ? `${getTimeZoneDisplayName(iana)} time (${getOffsetLabel(iana, new Date())})` : (defaultHint || "Search for a place to auto-detect timezone")}
        </div>

        {displayLabel && iana && (
          <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
            📍 {displayLabel}
          </div>
        )}
      </div>
    </div>
  );
}
