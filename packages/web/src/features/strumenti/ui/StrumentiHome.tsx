import { Link } from "react-router-dom";
import { AppShell, Card } from "../../../shared/ui";
import { strumentiI18n as t } from "../i18n";

const TOOLS = [
  {
    to: "/strumenti/dosaggio",
    title: t.dosaggioTitle,
    hint: t.dosaggioSubtitle,
  },
];

export function StrumentiHome() {
  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl text-(--color-text)">{t.title}</h1>
        <p className="text-(--color-text-muted) mt-2 text-sm">{t.subtitle}</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="block">
            <Card className="h-full hover:border-(--color-border-strong) transition-colors">
              <h2 className="text-base font-medium text-(--color-text)">
                {tool.title}
              </h2>
              <p className="text-sm text-(--color-text-muted) mt-1">
                {tool.hint}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
