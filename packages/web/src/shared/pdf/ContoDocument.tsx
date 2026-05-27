import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatDate } from "../../shared/lib/format";
import { ensureFontsRegistered } from "./fonts";
import { AziendaHeader } from "./shared/AziendaHeader";
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
    note,
  } = data;

  return (
    <Document
      title={`Conto ${numero}`}
      author={emessoDa.displayName}
      subject="Conto prestazioni veterinarie"
      creator="gestionale.stefanovalloncini.com"
      producer="gestionale.stefanovalloncini.com"
      language="it"
    >
      <Page size="A4" style={styles.page} wrap>
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

        <RiepilogoTable righe={righe} totale={totale} />

        {note ? (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.notesLabel}>Note</Text>
            <Text style={styles.notesText}>{note}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>
            Documento generato il {formatDate(emessoIl)} · gestionale.stefanovalloncini.com
          </Text>
          <Text
            render={({
              pageNumber,
              totalPages,
            }: {
              pageNumber: number;
              totalPages: number;
            }) => `Pagina ${pageNumber} di ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
