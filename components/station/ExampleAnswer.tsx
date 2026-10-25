import type { ReactNode } from 'react'

/**
 * The answer a guide's worked example ends on, on a strip of the guide's
 * board colour, its figures on split-flap tiles (<Flap> inside), as the
 * tools show theirs (Oct 2026; it had been a bold line under a rule).
 * `label` is the answer as plain text.
 */
export function ExampleAnswer({ label, children }: { label: string; children: ReactNode }) {
  // One tile per character reads aloud as "$ 9 8 0": screen readers get the
  // plain answer instead
  return (
    <p className="st-example-answer">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{children}</span>
    </p>
  )
}
