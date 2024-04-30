import { cn } from "~/lib/utils";

interface Props {
  width?: string | number;
  height?: string | number;
  viewBox?: string;
  style?: React.CSSProperties;
  className?: string;
  points: { x: number; y: number }[];
  fillColor?: string;
  edgeColor?: string;
}

export function Polygon({
  // height = 400,
  // width = 400,
  // viewBox = "-10 -10 20 20",
  style,
  className,
  fillColor = "lime",
  edgeColor = "green",
  points,
}: Props) {
  const pointsString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const maxX = Math.max(...points.map((p) => p.x));
  const minX = Math.min(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));
  const minY = Math.min(...points.map((p) => p.y));
  const viewBox = `${minX - 1} ${minY - 1} ${maxX - minX + 2} ${
    maxY - minY + 2
  }`;
  return (
    <svg
      // width={width}
      // height={height}
      width={250}
      viewBox={viewBox}
      style={style}
      className={cn("scale-75", className)}
    >
      <polygon points={pointsString} fill={fillColor} />
      <circle cx="0" cy="0" r="0.2" style={{ color: "red" }} />
      {points.map((point) => (
        <circle
          key={`${point.x},${point.y}`}
          cx={point.x}
          cy={point.y}
          r={0.2}
          style={{ color: edgeColor }}
        />
      ))}
      {/* <circle cx="-5" cy="-5" r="0.2" style={{ color: edgeColor }} />
      <circle cx="5" cy="-5" r="0.2" style={{ color: edgeColor }} />
      <circle cx="5" cy="5" r="0.2" style={{ color: edgeColor }} />
      <circle cx="-5" cy="5" r="0.2" style={{ color: edgeColor }} /> */}
    </svg>
  );
}
