import type { ReactNode } from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatDate } from "../../../shared/lib/format";
import { styles } from "../styles";

interface PdfShellProps {
  title: string;
  subject: string;
  emessoIl: Date;
  author?: string;
  children: ReactNode;
}

export function PdfShell({
  title,
  subject,
  emessoIl,
  author,
  children,
}: PdfShellProps) {
  return (
    <Document
      title={title}
      subject={subject}
      creator="gestionale.stefanovalloncini.com"
      producer="gestionale.stefanovalloncini.com"
      language="it"
      {...(author ? { author } : {})}
    >
      <Page size="A4" style={styles.page} wrap>
        {children}

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
