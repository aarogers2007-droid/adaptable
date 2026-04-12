interface ConsistencyLineProps {
  reflectionCount: number;
  weekCount: number;
}

export default function ConsistencyLine({ reflectionCount, weekCount }: ConsistencyLineProps) {
  if (reflectionCount === 0) return null;
  return (
    <p className="text-sm text-[#4B5563]">
      You&apos;ve reflected {reflectionCount} {reflectionCount === 1 ? "time" : "times"} across{" "}
      {weekCount} {weekCount === 1 ? "week" : "weeks"}
    </p>
  );
}
