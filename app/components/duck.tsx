import { duckMark } from "../../lib/duck-mark.mjs";
export function Duck({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: duckMark() }}
    />
  );
}
