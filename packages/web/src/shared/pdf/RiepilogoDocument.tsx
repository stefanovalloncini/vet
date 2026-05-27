import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatDate } from "../../shared/lib/format";
import { ensureFontsRegistered } from "./fonts";
import { AziendaHeader } from "./shared/AziendaHeader";
import { RiepilogoTable } from "./shared/RiepilogoTable";
import { styles } from "./styles";
import type { RiepilogoPdfData } from "./shared/types";

ensureFontsRegistered();

interface RiepilogoDocumentProps {
  data: RiepilogoPdfData;
}

export function RiepilogoDocument({ data }: RiepilogoDocumentProps) {
  const { azienda, righe, periodo, emessoIl, vetName, totale } = data;

  return (
    <Document
      title="Riepilogo prestazioni"
      subject="Riepilogo prestazioni veterinarie"
      creator="gestionale.stefanovalloncini.com"
      producer="gestionale.stefanovalloncini.com"
      language="it"
    >
      <Page size="A4" style={styles.page} wrap>
        <AziendaHeader
          title="Riepilogo prestazioni"
          subtitle="Documento informativo non fiscale"
          azienda={azienda}
          periodo={periodo}
          emessoIl={emessoIl}
          {...(vetName
            ? { rightMeta: [{ label: "Veterinario", value: vetName }] }
            : {})}
        />

        <RiepilogoTable righe={righe} totale={totale} />

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
