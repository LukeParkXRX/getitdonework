// server-safe (no "use client" — pure rendering)

type BadgeConfig = {
  label: string;
  icon: string;
  color: string;
};

const BADGE_DISPLAY: Record<string, BadgeConfig> = {
  top_enabler:      { label: "Top Enabler",      icon: "★",  color: "var(--color-accent)" },
  rising_enabler:   { label: "Rising Star",       icon: "✨", color: "var(--color-amber)" },
  verified_startup: { label: "Verified",          icon: "✓",  color: "var(--color-blue)" },
  power_startup:    { label: "Power User",        icon: "⚡", color: "var(--color-accent)" },
  early_supporter:  { label: "Early Supporter",   icon: "🚀", color: "var(--color-amber)" },
  top_org:          { label: "Top Organization",  icon: "🏆", color: "var(--color-accent)" },
};

export function UserBadge({ badge }: { badge: string }) {
  const config = BADGE_DISPLAY[badge];
  if (!config) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-display)",
        backgroundColor: "var(--color-card)",
        color: config.color,
        border: `1px solid ${config.color}`,
        whiteSpace: "nowrap",
        lineHeight: 1.6,
      }}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export function UserBadges({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
      }}
    >
      {badges.map((b) => (
        <UserBadge key={b} badge={b} />
      ))}
    </div>
  );
}
