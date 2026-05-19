export function VersionBadge() {
  const sha = __APP_VERSION__.sha;
  const date = __APP_VERSION__.builtAt.slice(0, 10);
  return (
    <p
      className="text-[10px] text-(--color-text-subtle) font-mono"
      title={`branch ${__APP_VERSION__.branch} · built ${__APP_VERSION__.builtAt}`}
    >
      v{sha} · {date}
    </p>
  );
}
