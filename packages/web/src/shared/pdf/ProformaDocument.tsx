import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatDate } from "../../shared/lib/format";
import { ensureFontsRegistered } from "./fonts";
import { AziendaHeader } from "./shared/AziendaHeader";
import { RiepilogoTable } from "./shared/RiepilogoTable";
import { styles } from "./styles";
import type { ProformaPdfData } from "./shared/types";

ensureFontsRegistered();

interface ProformaDocumentProps {
  data: ProformaPdfData;
}

export function ProformaDocument({ data }: ProformaDocumentProps) {
  const { azienda, righe, periodo, emessoIl, emessoDa, totale } = data;

  return (
    <Document
      title="Proforma prestazioni"
      author={emessoDa.displayName}
      subject="Proforma — non è una fattura"
      creator="gestionale.stefanovalloncini.com"
      producer="gestionale.stefanovalloncini.com"
      language="it"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.watermark} fixed>
          BOZZA
        </Text>

        <AziendaHeader
          title="PROFORMA — non è una fattura"
          subtitle="Anteprima del conto, soggetta a revisione"
          azienda={azienda}
          periodo={periodo}
          emessoIl={emessoIl}
          rightMeta={[
            { label: "Emesso da", value: emessoDa.displayName },
          ]}
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
