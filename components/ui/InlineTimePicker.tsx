"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * Time field: type straight into it ("930", "9:30", "17:45", "5:30pm"),
 * or open the panel for hour and five-minute steps. Rebuilt Oct 2026 after
 * an audit of the homepage inputs:
 *  - the field only ever shows the time actually in use: Cancel, Escape or a
 *    click outside the panel discard its steps, and a typed time that isn't
 *    one ("25:00") is refused with a note instead of sitting in the field
 *    while the answer used the old value;
 *  - typing needs no panel (it took open, type, Confirm);
 *  - minutes step by five (9:00 to 9:30 was 30 taps), carrying into the hour;
 *  - the panel is wide enough for its controls and anchored inside the
 *    field's right edge (at 156px it spilled off phones);
 *  - on touch screens it is the phone's own time wheel (input type="time").
 * The panel's button is out of the Tab order (one stop per field, not two:
 * a week of shifts was 14 extra Tabs); from the keyboard, Alt+↓ opens it.
 * The value in and out is "HH:MM:SS", 24-hour, as before.
 */

interface InlineTimePickerProps {
  value: string;
  onChange: (timeStr: string) => void;
  is24h: boolean;
  placeholder?: string;
  className?: string;
  /** Accessible field name (e.g. "Start time") — announced with the value. */
  ariaLabel?: string;
  /** id for the input, so a <label htmlFor> can point at it. */
  id?: string;
}

const DAY = 1440;
const pad = (n: number) => String(n).padStart(2, "0");

/** "09:30:00" → minutes since midnight, or null. */
function toMinutes(value: string): number | null {
  const [h, m] = value.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}
const toValue = (t: number) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}:00`;
const wrap = (t: number) => ((t % DAY) + DAY) % DAY;
/** Five minutes on or back, landing on a multiple of five (9:02 → 9:05 or 9:00). */
const step5 = (t: number, dir: 1 | -1) => wrap(dir > 0 ? t - (t % 5) + 5 : t % 5 ? t - (t % 5) : t - 5);

/** Minutes since midnight as the field shows them: "17:45" or "5:45 PM". */
export function formatTime(t: number, is24h: boolean): string {
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (is24h) return `${pad(h)}:${pad(m)}`;
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

/**
 * What someone typed, as minutes since midnight, or null if it isn't a time:
 * "9", "930", "0930", "9:30", "9.30", "21:30", "5:30pm", "5 pm", "5p".
 * Without am/pm in 12-hour mode, 1–11 keeps the field's current half of the
 * day (so "5:30" in an afternoon field is 5:30 PM) and a bare 12 is noon.
 */
export function parseTime(text: string, is24h: boolean, current: number | null): number | null {
  const m = text.trim().toLowerCase().match(/^(\d{1,2})(?:[:.h]?(\d{2}))?\s*(a|p|am|pm|a\.m\.|p\.m\.)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  if (min > 59) return null;
  const ap = m[3]?.[0];
  if (ap) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (ap === "p" ? 12 : 0);
  } else if (!is24h && h >= 1 && h <= 11) {
    h += current !== null && current >= 720 ? 12 : 0;
  }
  return h > 23 ? null : h * 60 + min;
}

export function InlineTimePicker({ value, onChange, is24h, className = "", ariaLabel, id }: InlineTimePickerProps) {
  const current = toMinutes(value);
  const shown = current === null ? "" : formatTime(current, is24h);
  const [text, setText] = useState(shown);
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(current ?? 540);
  // Touch screens get the phone's own time wheel; decided after mount so the
  // server and first client render match
  const [native, setNative] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const noteId = useId();

  useEffect(() => {
    setNative(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 6000);
    return () => clearTimeout(id);
  }, [note]);

  // The field follows the value (and the 12h/24h switch) unless it's being typed in
  useEffect(() => {
    if (!focused) setText(shown);
  }, [shown, focused]);

  const set = useCallback(
    (t: number) => {
      setNote(null);
      if (t !== current) onChange(toValue(t));
      setText(formatTime(t, is24h));
    },
    [current, onChange, is24h],
  );

  // Typed text: taken if it's a time, refused with a note if not
  const commit = useCallback(() => {
    const typed = text.trim();
    if (typed === shown) return;
    const t = parseTime(typed, is24h, current);
    if (t === null) {
      if (typed)
        setNote(
          `“${typed}” isn't a time, so ${shown} is kept. ${is24h ? "Hours run 0–23 and minutes 0–59." : "Try a time like 5:30 pm."}`,
        );
      setText(shown);
      return;
    }
    set(t);
  }, [text, shown, is24h, current, set]);

  const close = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) inputRef.current?.focus();
  }, []);

  // Outside click or focus leaving the panel: close without saving
  useEffect(() => {
    if (!isOpen) return;
    const inside = (n: EventTarget | null) => n instanceof Node && !!containerRef.current?.contains(n);
    const onPointer = (e: PointerEvent) => {
      if (!inside(e.target)) close(false);
    };
    const onFocus = (e: FocusEvent) => {
      if (!inside(e.target)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocus);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button")?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocus);
    };
  }, [isOpen, close]);

  const open = () => {
    commit();
    setDraft(parseTime(text, is24h, current) ?? current ?? 540);
    setIsOpen(true);
  };
  const stepMinutes = (dir: 1 | -1) => setDraft((t) => step5(t, dir));

  if (native) {
    return (
      <div className={`st-time-box relative flex items-center w-full bg-background dark:bg-muted border border-border rounded-xl ${className}`}>
        <input
          type="time"
          id={id}
          aria-label={ariaLabel}
          value={current === null ? "" : `${pad(Math.floor(current / 60))}:${pad(current % 60)}`}
          onChange={(e) => {
            const t = toMinutes(e.target.value);
            if (t !== null) set(t);
          }}
          className="st-time-input w-full px-4 py-3 bg-transparent font-mono text-foreground outline-none"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="st-time-box flex items-center w-full bg-background dark:bg-muted border border-border rounded-xl transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/50">
        <input
          ref={inputRef}
          type="text"
          id={id}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-label={ariaLabel}
          aria-invalid={note ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          aria-keyshortcuts="Alt+ArrowDown"
          value={text}
          placeholder={is24h ? "09:00" : "9:00 AM"}
          maxLength={10}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            setNote(null);
          }}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && e.altKey) {
              e.preventDefault();
              open();
            } else if (e.key === "Enter") {
              // Take the time; inside a form the Enter then submits it
              commit();
            } else if (e.key === "Escape") {
              setText(shown);
              setNote(null);
            } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && current !== null) {
              e.preventDefault();
              set(step5(parseTime(text, is24h, current) ?? current, e.key === "ArrowUp" ? 1 : -1));
            }
          }}
          className="st-time-input min-w-0 flex-1 px-4 py-3 bg-transparent font-mono text-foreground outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`${ariaLabel ? `${ariaLabel}: ` : ""}choose with buttons`}
          onClick={() => (isOpen ? close(true) : open())}
          className="st-time-toggle shrink-0 self-stretch px-3 text-muted-foreground hover:text-foreground"
        >
          <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {note && (
        // Floats under the field, so it moves nothing around it (the fields
        // beside it stay level); clears on the next edit or after a few seconds
        <p
          id={noteId}
          role="status"
          className="st-time-note absolute left-0 top-full z-50 mt-1 w-max max-w-[17rem] rounded-md px-3 py-2 text-sm text-red-700 dark:text-red-300 bg-background shadow-md border border-red-200 dark:border-red-900"
        >
          {note}
        </p>
      )}

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={`${ariaLabel ? `${ariaLabel}: ` : ""}choose a time`}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close(true);
            }
          }}
          className="st-pop st-time-pop absolute top-full right-0 mt-2 z-[100] w-[17rem] max-w-[calc(100vw-2rem)] bg-background dark:bg-card border border-border rounded-xl shadow-xl p-4"
        >
          <p className="text-center text-3xl font-bold font-mono text-foreground mb-3" aria-live="polite">
            {formatTime(draft, is24h)}
          </p>
          {!is24h && (
            <div className="flex justify-center mb-3" role="group" aria-label="Morning or afternoon">
              <div className="flex bg-muted/50 dark:bg-muted rounded-lg p-1">
                {(["AM", "PM"] as const).map((p) => {
                  const on = (draft >= 720) === (p === "PM");
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      onClick={() => !on && setDraft((t) => wrap(t + 720))}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="space-y-3">
            {(
              [
                ["Hour", "One hour", () => setDraft((t) => wrap(t - 60)), () => setDraft((t) => wrap(t + 60))],
                ["Minutes", "5 minutes", () => stepMinutes(-1), () => stepMinutes(1)],
              ] as const
            ).map(([label, unit, down, up]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={down} aria-label={`${unit} earlier`} className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted hover:bg-muted flex items-center justify-center">
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button type="button" onClick={up} aria-label={`${unit} later`} className="w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted hover:bg-muted flex items-center justify-center">
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => close(true)}
              className="flex-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                set(draft);
                close(true);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
