interface SidebarSectionHeaderProps {
  title: string;
  collapsed: boolean;
  first: boolean;
}

export function SidebarSectionHeader({ title, collapsed, first }: SidebarSectionHeaderProps) {
  return (
    <div
      className="grid overflow-hidden"
      style={{
        gridTemplateRows: collapsed ? "0fr" : "1fr",
        transition: "grid-template-rows var(--motion-layout) var(--ease-out-quint)",
        marginTop: collapsed ? "0" : first ? "0.25rem" : "0.625rem",
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <p
          className="px-2 pb-1 text-[10px] uppercase tracking-[0.12em] text-(--color-text-subtle)"
          style={{
            opacity: collapsed ? 0 : 1,
            transition: "opacity var(--motion-fast) var(--ease-out-quart)",
          }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
