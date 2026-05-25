import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  NumberField,
  PageHeader,
  Select,
  TextField,
  TextArea,
  Toolbar,
} from "../../../shared/ui";

export function DevPrimitivesPage() {
  const [tariffa, setTariffa] = useState<number | "">(45);
  const [ore, setOre] = useState<number | "">(1.5);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("visita");
  const [note, setNote] = useState("");
  const [dlgOpen, setDlgOpen] = useState(false);

  return (
    <main className="min-h-screen bg-(--color-background) text-(--color-text) px-4 sm:px-8 py-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <PageHeader title="Primitive UI" subtitle="Anteprima dei componenti del design system. Solo in sviluppo." />

        <Section title="Button">
          <Toolbar gap="md" wrap>
            <Button variant="primary">Salva</Button>
            <Button variant="secondary">Indietro</Button>
            <Button variant="ghost">Annulla</Button>
            <Button variant="danger">Elimina</Button>
            <Button variant="primary" disabled>Disabilitato</Button>
          </Toolbar>
          <Toolbar gap="md" wrap>
            <Button variant="primary" size="sm">Piccolo</Button>
            <Button variant="primary" size="md">Medio (44px)</Button>
            <Button variant="primary" size="lg">Grande</Button>
          </Toolbar>
        </Section>

        <Section title="NumberField (niente frecce nere)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            <NumberField id="dev-tariffa" label="Tariffa" value={tariffa} onChange={setTariffa} step={5} min={0} max={10000} suffix="EUR" />
            <NumberField id="dev-ore" label="Ore" value={ore} onChange={setOre} step={0.25} min={0.25} max={24} />
            <NumberField id="dev-min" label="Al minimo" value={0} onChange={() => {}} min={0} max={10} />
            <NumberField id="dev-err" label="Con errore" value={999} onChange={() => {}} step={1} error="Tariffa fuori limite" />
            <NumberField id="dev-disabled" label="Disabilitato" value={3} onChange={() => {}} disabled />
            <NumberField id="dev-hint" label="Con suggerimento" value={1} onChange={() => {}} hint="Step di 0,25 per il quarto d'ora" />
          </div>
        </Section>

        <Section title="TextField / Select / TextArea">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            <TextField id="dev-nome" label="Nome azienda" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Allevamento Rossi" />
            <Select id="dev-tipo" label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} options={[{ value: "visita", label: "Visita" }, { value: "fecondazione", label: "Fecondazione" }]} />
            <TextField id="dev-err-text" label="Con errore" value="abc" onChange={() => {}} error="Campo obbligatorio" />
            <TextField id="dev-date" label="Data" type="date" defaultValue="2026-05-25" />
          </div>
          <TextArea id="dev-note" label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annota dettagli operativi" />
        </Section>

        <Section title="Card e Badge">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <span className="text-sm">Allevamento Bianchi</span>
                <Badge tone="success">Saldato</Badge>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center justify-between">
                <span className="text-sm">Stalla Verdi</span>
                <Badge tone="danger">Non saldato</Badge>
              </div>
            </Card>
            <Card padding="lg" elevated>
              <div className="flex items-center justify-between">
                <span className="text-sm">Azienda Neri</span>
                <Badge tone="warning">Da emettere</Badge>
              </div>
            </Card>
          </div>
          <Toolbar gap="sm" wrap>
            <Badge tone="neutral">Neutrale</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success" dot>Saldato</Badge>
            <Badge tone="danger" dot>Non saldato</Badge>
            <Badge tone="warning" dot>Attenzione</Badge>
            <Badge dot tone="success" aria-label="Stato saldato" />
            <Badge dot tone="danger" aria-label="Stato non saldato" />
            <Badge dot tone="warning" aria-label="Stato in attesa" />
          </Toolbar>
        </Section>

        <Section title="Dialog">
          <Button variant="primary" onClick={() => setDlgOpen(true)}>Apri dialog</Button>
          <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} labelledBy="dlg-title">
            <div className="p-6 space-y-4">
              <h2 id="dlg-title" className="text-lg font-semibold">Conferma operazione</h2>
              <p className="text-sm text-(--color-text-muted)">Eliminare definitivamente l&apos;attivita? L&apos;operazione non e&apos; reversibile.</p>
              <Toolbar gap="md" align="end">
                <Button variant="ghost" onClick={() => setDlgOpen(false)}>Annulla</Button>
                <Button variant="danger" onClick={() => setDlgOpen(false)}>Elimina</Button>
              </Toolbar>
            </div>
          </Dialog>
        </Section>

        <Section title="Toolbar">
          <Toolbar gap="sm" align="between">
            <span className="text-sm text-(--color-text-muted)">Allevamento Rossi</span>
            <Toolbar gap="sm">
              <Button variant="secondary" size="sm">Esporta</Button>
              <Button variant="primary" size="sm">Nuova attivita</Button>
            </Toolbar>
          </Toolbar>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs uppercase tracking-wider font-medium text-(--color-text-subtle)">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
