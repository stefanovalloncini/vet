import { Text, View } from "@react-pdf/renderer";
import { ensureFontsRegistered } from "./fonts";
import { AziendaHeader } from "./shared/AziendaHeader";
import { PdfShell } from "./shared/PdfShell";
import { RiepilogoTable } from "./shared/RiepilogoTable";
import { styles } from "./styles";
import type { ContoPdfData } from "./shared/types";

ensureFontsRegistered();

interface ContoDocumentProps {
  data: ContoPdfData;
}

export function ContoDocument({ data }: ContoDocumentProps) {
  const {
    azienda,
    righe,
    periodo,
    numero,
    emessoIl,
    emessoDa,
    totale,
    armadietto,
    note,
  } = data;

  return (
    <PdfShell
      title={`Conto ${numero}`}
      subject="Conto prestazioni veterinarie"
      emessoIl={emessoIl}
      author={emessoDa.displayName}
    >
      <AziendaHeader
        title={`CONTO N° ${numero}`}
        subtitle="Documento contabile non fiscale"
        azienda={azienda}
        periodo={periodo}
        emessoIl={emessoIl}
        rightMeta={[
          { label: "Numero", value: numero },
          { label: "Emesso da", value: emessoDa.displayName },
        ]}
      />

      <RiepilogoTable
        righe={righe}
        totale={totale}
        {...(armadietto !== undefined ? { armadietto } : {})}
      />

      {note ? (
        <View style={styles.notesBlock} wrap={false}>
          <Text style={styles.notesLabel}>Note</Text>
          <Text style={styles.notesText}>{note}</Text>
        </View>
      ) : null}
    </PdfShell>
  );
}
