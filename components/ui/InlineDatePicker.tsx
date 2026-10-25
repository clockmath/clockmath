"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { format, isToday, isTomorrow, isYesterday, addDays } from "date-fns";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";

/**
 * Date field with Today/Tomorrow/Yesterday shortcuts and a calendar.
 *
 * Oct 2026 audit: Radix Popover (+ floating-ui) and react-day-picker were
 * imported up front on the home, time zone, timesheet and countdown pages —
 * about 35 KB gzipped of script before anyone opened a date. The popover is
 * now this component's own (portal, fixed position, flips above when there's
 * no room below; Escape, an outside click or focus leaving closes it), and
 * the calendar loads on demand, prefetched on hover/focus of the field.
 */
const loadCalendar = () => import("./calendar").then((m) => m.Calendar);
const Calendar = dynamic(loadCalendar, {
  ssr: false,
  loading: () => (
    <div className="w-[280px] h-[330px] grid place-items-center text-sm text-muted-foreground">Loading calendar…</div>
  ),
});
let calendarRequested = false;
const prefetchCalendar = () => {
  if (calendarRequested) return;
  calendarRequested = true;
  void loadCalendar();
};

interface InlineDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
  /** Open straight to the calendar, skipping the Today/Tomorrow quick options. */
  startOnCalendar?: boolean;
  /** Accessible field name (e.g. "Start date") — announced with the value. */
  ariaLabel?: string;
  /** id for the field's button, so a <label htmlFor> can point at it. */
  id?: string;
  /** Say "Today", "Tomorrow" or "Yesterday" for those dates (the device's
   *  days); false shows the date itself, for a date in another place. */
  relative?: boolean;
}

export function InlineDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  startOnCalendar = false,
  ariaLabel,
  id,
  relative = true,
}: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(startOnCalendar);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Format the display value
  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    if (relative && isToday(value)) return "Today";
    if (relative && isTomorrow(value)) return "Tomorrow";
    if (relative && isYesterday(value)) return "Yesterday";
    return format(value, "MMM d, yyyy");
  }, [value, placeholder, relative]);

  // Quick date options
  const quickOptions = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: addDays(new Date(), 1) },
    { label: "Yesterday", date: addDays(new Date(), -1) },
  ];

  const close = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const handleQuickSelect = (date: Date) => {
    onChange(date);
    close(true);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      close(true);
    }
  };

  // Reset calendar view when the panel closes (back to the configured entry view)
  useEffect(() => {
    if (!isOpen) {
      setShowCalendar(startOnCalendar);
      setPos(null);
    }
  }, [isOpen, startOnCalendar]);

  // Place the panel under the field (or above it when it doesn't fit below),
  // kept inside the viewport; follow the field on scroll and resize.
  const place = useCallback(() => {
    const t = triggerRef.current;
    const p = panelRef.current;
    if (!t || !p) return;
    const r = t.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const gap = 4;
    const margin = 8;
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    let top = r.bottom + gap;
    if (top + h > vh - margin && r.top - gap - h >= margin) top = r.top - gap - h;
    const left = Math.max(margin, Math.min(r.left, vw - margin - w));
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) place();
  }, [isOpen, showCalendar, place]);

  useEffect(() => {
    if (!isOpen) return;
    const p = panelRef.current;
    // The calendar arrives a moment after opening; re-place when it does.
    const ro = typeof ResizeObserver !== "undefined" && p ? new ResizeObserver(() => place()) : null;
    if (ro && p) ro.observe(p);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const inside = (n: EventTarget | null) =>
      n instanceof Node && (!!panelRef.current?.contains(n) || !!triggerRef.current?.contains(n));
    const onPointer = (e: PointerEvent) => {
      if (!inside(e.target)) close(false);
    };
    const onFocus = (e: FocusEvent) => {
      if (!inside(e.target)) close(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocus);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isOpen, close, place]);

  // Move focus into the panel when it opens, as the Radix popover did: the
  // first shortcut here; the calendar focuses its selected day itself
  // (react-day-picker's autoFocus) once it has loaded.
  useEffect(() => {
    if (!isOpen || showCalendar) return;
    const id = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button")?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen, showCalendar]);

  const panel = isOpen
    ? createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={ariaLabel ? `${ariaLabel}: choose a date` : "Choose a date"}
          style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden" }}
          className="st-pop bg-popover text-popover-foreground z-50 w-auto rounded-md border shadow-md"
        >
          {!showCalendar ? (
            <div className="p-2 space-y-1">
              {/* Quick options */}
              {quickOptions.map((option) => {
                const isSelected = value &&
                  format(value, "yyyy-MM-dd") === format(option.date, "yyyy-MM-dd");

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleQuickSelect(option.date)}
                    className={`
                      w-full px-3 py-2 text-left rounded-lg text-sm font-medium
                      transition-colors
                      ${isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                );
              })}

              {/* Divider */}
              <div className="border-t border-border my-2" />

              {/* Pick a date option */}
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="w-full px-3 py-2 text-left rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                Pick a date...
              </button>
            </div>
          ) : (
            <div className="p-2">
              {/* Back button (only when there's a quick-options view to return to) */}
              {!startOnCalendar && (
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="mb-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                  Back
                </button>
              )}

              {/* Calendar — wide year range so the year dropdown reaches any
                  realistic date (historical durations + future countdowns). */}
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleCalendarSelect}
                captionLayout="dropdown"
                startMonth={new Date(1920, 0)}
                endMonth={new Date(new Date().getFullYear() + 20, 11)}
                fixedWeeks
                autoFocus
              />
            </div>
          )}
        </div>,
        // Inside the page's .station frame, so the panel gets its tokens,
        // font and line colour (fixed positioning is unaffected)
        triggerRef.current?.closest(".station") ?? document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={`${ariaLabel ? ariaLabel + ', ' : ''}${displayValue}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => setIsOpen((o) => !o)}
        onPointerEnter={prefetchCalendar}
        onFocus={prefetchCalendar}
        className={`
          flex items-center justify-between gap-2
          w-full px-4 py-3
          bg-background dark:bg-muted
          border border-border dark:border-border
          rounded-xl
          text-left font-medium
          hover:border-primary/50
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          transition-all duration-200
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {displayValue}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {panel}
    </>
  );
}
