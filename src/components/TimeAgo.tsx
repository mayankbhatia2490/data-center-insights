import { format, formatDistanceToNow } from "date-fns";
import { useHydrated } from "@/hooks/useHydrated";

// Pre-rendered pages are built hours before they are read, so "5 minutes ago" would be wrong
// and would not match the browser's first render. Show the fixed date until hydrated.
const TimeAgo = ({ date }: { date: string | null | undefined }) => {
  const hydrated = useHydrated();
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return (
    <time dateTime={d.toISOString()}>
      {hydrated ? formatDistanceToNow(d, { addSuffix: true }) : format(d, "d MMM yyyy")}
    </time>
  );
};

export default TimeAgo;
