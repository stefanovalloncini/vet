export { ContoDocument } from "./ContoDocument";
export { ProformaDocument } from "./ProformaDocument";
export { RiepilogoDocument } from "./RiepilogoDocument";

export { RiepilogoTable } from "./shared/RiepilogoTable";
export { AziendaHeader } from "./shared/AziendaHeader";

export { ensureFontsRegistered } from "./fonts";
export { styles, colors, spacing } from "./styles";

export { renderPdfToBlob, downloadPdf } from "./renderToBlob";
export type { PdfBlobResult } from "./renderToBlob";

export { buildWhatsappShareUrl, openWhatsappShare } from "./share/whatsapp";
export type { WhatsappShareInput } from "./share/whatsapp";

export type {
  ContoPdfData,
  ProformaPdfData,
  RiepilogoPdfData,
} from "./shared/types";
