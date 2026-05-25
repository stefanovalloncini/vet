import { Link, useLocation } from "react-router-dom";
import { useAuthState } from "../../features/auth";
import { PRIMARY_NAV_ITEMS, visibleItems } from "./sidebar/SidebarConfig";

export function MobileNav() {
  const { user } = useAuthState();
  const location = useLocation();
  const items = visibleItems(
    PRIMARY_NAV_ITEMS,
    user?.caps as ReadonlySet<string> | undefined
  );
  if (items.length === 0) return null;
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-(--color-border) bg-(--color-surface) print:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigazione principale"
    >
      <div className="flex">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-current={active ? "page" : undefined}
              className={[
                "relative flex-1 min-w-0 flex flex-col items-center gap-1 py-2 px-1",
                "text-[10px] leading-tight",
                "transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
                active ? "text-(--color-text) font-medium" : "text-(--color-text-muted)",
              ].join(" ")}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-4 right-4 h-[2px] bg-(--color-accent) rounded-b-sm"
                />
              ) : null}
              <Icon
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className={active ? "text-(--color-accent)" : ""}
              />
              <span className="max-w-full truncate">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
