import type { ReactNode } from 'react'

/**
 * The answer a guide's worked example ends on, on a strip of the guide's
 * board colour, its figures on split-flap tiles (<Flap> inside), as the
 * tools show theirs (Oct 2026; it had been a bold line under a rule).
 */
export function ExampleAnswer({ children }: { children: ReactNode }) {
  return <p className="st-example-answer">{children}</p>
}
