interface SidebarSectionHeaderProps {
  title: string;
  collapsed: boolean;
}

export function SidebarSectionHeader({ title, collapsed }: SidebarSectionHeaderProps) {
  return (
    <div
      className="grid overflow-hidden"
      style={{
        gridTemplateRows: collapsed ? "0fr" : "1fr",
        transition: "grid-template-rows var(--motion-layout) var(--ease-out-quint)",
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <p
          className="px-3 pt-3 pb-1.5 text-[11px] uppercase tracking-[0.14em] text-(--color-text-subtle) font-medium"
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
