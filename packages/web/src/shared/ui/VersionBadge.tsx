interface VersionBadgeProps {
  email?: string | null | undefined;
}

export function VersionBadge({ email }: VersionBadgeProps = {}) {
  const sha = __APP_VERSION__.sha;
  const date = __APP_VERSION__.builtAt.slice(0, 10);
  return (
    <div
      className="text-[11px] text-(--color-text-subtle) font-mono leading-tight space-y-0.5"
      title={`branch ${__APP_VERSION__.branch} · built ${__APP_VERSION__.builtAt}`}
    >
      {email ? <span className="block break-all">{email}</span> : null}
      <span className="block tabular-nums">v{sha} · {date}</span>
    </div>
  );
}
