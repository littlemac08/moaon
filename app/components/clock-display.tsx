type ClockDisplayProps = { value: string };

/** Separate digits let the separator remain optically centered as numerals stretch. */
export function ClockDisplay({ value }: ClockDisplayProps) {
  const [minutes, seconds] = value.split(":");
  return (
    <div className={`clock-display ${minutes.length > 2 ? "clock-display-long" : ""}`} aria-hidden="true">
      <span className="clock-pair">
        {minutes.split("").map((digit, index) => <span className="clock-digit" key={`m${index}`}>{digit}</span>)}
      </span>
      <span className="clock-colon"><i /><i /></span>
      <span className="clock-pair">
        {seconds.split("").map((digit, index) => <span className="clock-digit" key={`s${index}`}>{digit}</span>)}
      </span>
    </div>
  );
}
