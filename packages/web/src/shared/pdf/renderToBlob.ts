import type { ReactElement } from "react";
import { pdf } from "@react-pdf/renderer";

export interface PdfBlobResult {
  blob: Blob;
  filename: string;
}

/**
 * Renders a <Document> JSX element to a PDF Blob. Browser-only.
 *
 * @param doc Any element produced by ContoDocument / ProformaDocument /
 *   RiepilogoDocument (or another @react-pdf/renderer Document).
 * @param filenameStem Stem without extension. ".pdf" is appended automatically.
 */
export async function renderPdfToBlob(
  doc: ReactElement,
  filenameStem: string,
): Promise<PdfBlobResult> {
  // `pdf()` accepts the document element directly. Calling toBlob() resolves
  // a Blob with type "application/pdf" on success.
  // Cast through `as never` to satisfy the @react-pdf type signature, which
  // requires DocumentProps; runtime accepts any Document element.
  const instance = pdf(doc as never);
  const blob = await instance.toBlob();
  return { blob, filename: `${filenameStem}.pdf` };
}

/**
 * Convenience: render to Blob and trigger a download via an anchor element.
 * Browser-only — touches `document` and `URL.createObjectURL`.
 */
export async function downloadPdf(
  doc: ReactElement,
  filenameStem: string,
): Promise<void> {
  const { blob, filename } = await renderPdfToBlob(doc, filenameStem);
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Defer revoke so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
