interface VersionBadgeProps {
  email?: string | null | undefined;
}

export function VersionBadge({ email }: VersionBadgeProps = {}) {
  const sha = __APP_VERSION__.sha;
  const date = __APP_VERSION__.builtAt.slice(0, 10);
  const parts = [email, `v${sha}`, date].filter(Boolean) as string[];
  return (
    <p
      className="text-[11px] text-(--color-text-subtle) font-mono tabular-nums truncate leading-tight"
      title={`branch ${__APP_VERSION__.branch} · built ${__APP_VERSION__.builtAt}`}
    >
      {parts.join(" · ")}
    </p>
  );
}
