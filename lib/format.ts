export function formatTimelineStep(
  iso: string,
  action: string,
  durationMin: number
): string {
  const date = new Date(iso);
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  if (durationMin === 0) {
    return `${timeStr} — ${action}`;
  }
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  const durStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim() : `${mins}m`;
  return `${timeStr} — ${action} (${durStr})`;
}
