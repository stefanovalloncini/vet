import { useState, type FormEvent } from "react";
import {
  Button,
  Card,
  InlineError,
  Select,
  TextField,
} from "../../../shared/ui";
import {
  allowlistEntryInputSchema,
  type ActorContext,
} from "@vet/shared";
import { allowlistI18n as t } from "../i18n";
import { useAddAllowlistEntry } from "../hooks/useAllowlist";

interface AddAllowlistEntryFormProps {
  roles: ReadonlyArray<{ id: string; name: string }>;
  user: ActorContext;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddAllowlistEntryForm({
  roles,
  user,
  onAdded,
  onCancel,
}: AddAllowlistEntryFormProps) {
  const add = useAddAllowlistEntry();
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("vet");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const notesTrim = notes.trim();
    const parsed = allowlistEntryInputSchema.safeParse({
      email: email.trim(),
      defaultRoleId: roleId,
      ...(notesTrim ? { notes: notesTrim } : {}),
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? t.saveError);
      return;
    }
    setErrorMsg(null);
    try {
      await add.mutateAsync({ input: parsed.data, actor: user.uid });
      onAdded();
    } catch {
      setErrorMsg(t.saveError);
    }
  }

  const busy = add.isPending;

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg ? <InlineError>{errorMsg}</InlineError> : null}
        <TextField
          id="allow-email"
          type="email"
          label={t.campoEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.campoEmailPlaceholder}
          required
          autoFocus
          disabled={busy}
        />
        <Select
          id="allow-role"
          label={t.campoRuolo}
          value={roleId}
          options={roleOptions}
          onChange={(e) => setRoleId(e.target.value)}
          disabled={busy}
        />
        <TextField
          id="allow-notes"
          label={t.campoNote}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
          maxLength={500}
        />
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            {t.annulla}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {t.aggiungi}
          </Button>
        </div>
      </form>
    </Card>
  );
}
