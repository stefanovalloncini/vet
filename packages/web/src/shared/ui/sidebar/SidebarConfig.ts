import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Building2,
  Bell,
  Wallet,
  BarChart3,
  Wrench,
  Tags,
  ShieldCheck,
  KeyRound,
  ScrollText,
  Users,
  Trash2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  requiredCap?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operatività",
    items: [
      { to: "/riepilogo", label: "Riepilogo", icon: LayoutDashboard, requiredCap: "activities.read.all" },
      { to: "/agenda", label: "Agenda", icon: Calendar, requiredCap: "activities.read.all" },
      { to: "/attivita", label: "Attività", icon: ClipboardList, requiredCap: "activities.read.all" },
      { to: "/aziende", label: "Aziende", icon: Building2, requiredCap: "aziende.read" },
      { to: "/promemoria", label: "Promemoria", icon: Bell, requiredCap: "reminders.read" },
    ],
  },
  {
    title: "Gestione",
    items: [
      { to: "/conti", label: "Conti", icon: Wallet, requiredCap: "conti.proforma" },
      { to: "/pagamenti", label: "Pagamenti (legacy)", icon: Wallet, requiredCap: "payments.read" },
      { to: "/statistiche", label: "Statistiche", icon: BarChart3, requiredCap: "activities.read.all" },
      { to: "/strumenti", label: "Strumenti", icon: Wrench },
    ],
  },
  {
    title: "Amministrazione",
    items: [
      { to: "/admin/tipi-attivita", label: "Tipi attività", icon: Tags, requiredCap: "activity_types.read" },
      { to: "/admin/ruoli", label: "Ruoli", icon: ShieldCheck, requiredCap: "roles.read" },
      { to: "/admin/allowlist", label: "Allowlist", icon: KeyRound, requiredCap: "allowlist.read" },
      { to: "/admin/audit", label: "Audit", icon: ScrollText, requiredCap: "audit.read" },
      { to: "/admin/stats-vet", label: "Statistiche veterinari", icon: Users, requiredCap: "users.read.all" },
    ],
  },
];

export const FOOTER_ITEMS: NavItem[] = [
  { to: "/cestino", label: "Cestino", icon: Trash2, requiredCap: "trash.read.own" },
  { to: "/impostazioni", label: "Impostazioni", icon: Settings },
];

export function isActivePath(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

export function visibleItems(items: NavItem[], caps?: ReadonlySet<string>): NavItem[] {
  return items.filter((item) => !item.requiredCap || caps?.has(item.requiredCap));
}

export function sectionContainsPath(
  section: NavSection,
  pathname: string,
  caps?: ReadonlySet<string>
): boolean {
  return section.items.some(
    (item) =>
      (!item.requiredCap || caps?.has(item.requiredCap)) &&
      isActivePath(pathname, item.to)
  );
}
