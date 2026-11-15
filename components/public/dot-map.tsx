/**
 * The dotted map of South Africa from the hero. The dots sit on a 9.6px grid, so each column is
 * stored as "column:first row-last row" ranges, read from the Figma frame.
 */
const COLUMNS =
  "2:24;3:25-27;4:25-30;5:25-32;6:25-34;7:25-36;8:25-38;9:25-43;10:24-44;11:24-44;12:24-45;13:24-45;14:24-46;15:11-46;16:11-45;17:11-45;18:11-45;19:11-44;20:12-44;21:12-44;22:12-43;23:12-43;24:12-43;25:12-43;26:13-43;27:13-43;28:13-43;29:14-43;30:14-43;31:14-43;32:14-43;33:14-43;34:14-43;35:13-43;36:12-42;37:10-42;38:9-42;39:8-42;40:7-41;41:6-41;42:5-40;43:5-39;44:4-38;45:3-37;46:3-37;47:2-36;48:2-35;49:1-34;50:1-33;51:1-32;52:2-31;53:2-30;54:2-29;55:2-27;56:4-12,15-26;57:8-10,16-25;58:18-25;59:18-24;60:18-24;61:18-20";

const STEP = 9.6;
const DOTS = COLUMNS.split(";").flatMap((column) => {
  const [col, ranges] = column.split(":");
  return ranges!.split(",").flatMap((range) => {
    const [from, to] = range.split("-").map(Number);
    return Array.from({ length: (to ?? from!) - from! + 1 }, (_, i) => ({
      x: Number(col) * STEP + 2.5,
      y: (from! + i) * STEP + 2.5,
    }));
  });
});

export function DotMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 613 457"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="#0f1f2d"
      fillOpacity="0.07"
    >
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.5} />
      ))}
    </svg>
  );
}
