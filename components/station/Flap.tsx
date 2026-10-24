/**
 * A figure on split-flap tiles, like a station's departure board: one tile
 * per character, each with the board's hinge line across it (type.css).
 * A tile whose character changes remounts, replaying its flip, so a ticking
 * countdown turns only the tiles that move. Render only values that are the
 * same on the server and in the first client render (one element per
 * character can't hydrate a different-length string); the station board
 * uses buildDayCount for that.
 */
export function Flap({ value }: { value: string }) {
  return (
    <span className="st-flap">
      {[...value].map((c, i) => (
        <span key={`${i}-${c}`} className="st-flap-c">
          {c}
        </span>
      ))}
    </span>
  )
}
