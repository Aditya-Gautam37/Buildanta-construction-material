type IconName = "arrow-right" | "bolt" | "check" | "chevron-down" | "lock" | "map-pin" | "package" | "phone" | "search" | "shield" | "sparkles" | "truck" | "user" | "x";

const paths: Record<IconName, React.ReactNode> = {
  "arrow-right": <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  "chevron-down": <path d="m6 9 6 6 6-6"/>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  "map-pin": <><path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  package: <><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="M20 16.5V7.5a1 1 0 0 0-.5-.87l-7-4a1 1 0 0 0-1 0l-7 4a1 1 0 0 0-.5.87v9a1 1 0 0 0 .5.87l7 4a1 1 0 0 0 1 0l7-4a1 1 0 0 0 .5-.87Z"/></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.3-1.4a2 2 0 0 1 2.1-.4c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
  sparkles: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/><path d="m5 13 .8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z"/></>,
  truck: <><path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/></>,
  x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
};

export function UiIcon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
