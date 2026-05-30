import { Link } from "react-router-dom";
import { Brand } from "../../../shared/ui";

export function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-(--color-background) text-(--color-text) px-6 py-10">
      <div className="max-w-prose mx-auto space-y-8">
        <header className="space-y-3">
          <Link
            to="/login"
            className="inline-block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-background)"
          >
            <Brand size="sm" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Informativa sul trattamento dei dati personali
          </h1>
          <p className="text-sm text-(--color-text-muted)">
            Ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR) e del D.Lgs.
            196/2003 come modificato dal D.Lgs. 101/2018.
          </p>
        </header>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-medium">Titolare del trattamento</h2>
          <p>
            Lo studio veterinario che utilizza l&apos;applicazione è titolare del trattamento
            dei dati delle aziende clienti, delle attività registrate e degli importi
            fatturati o da fatturare.
          </p>
          <p>
            Il gestore tecnico della piattaforma è Stefano Valloncini (
            <a
              href="mailto:stefano.valloncini@gmail.com"
              className="text-(--color-accent) underline-offset-4 hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-background)"
            >
              stefano.valloncini@gmail.com
            </a>
            ), che agisce in qualità di responsabile del trattamento per i dati ospitati
            sull&apos;infrastruttura.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-medium">Dati trattati e finalità</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Dati identificativi del veterinario (email, nome). Base giuridica: esecuzione
              di un contratto di servizio.
            </li>
            <li>
              Anagrafica delle aziende clienti (denominazione, indirizzo, partita IVA,
              recapiti, note). Base giuridica: legittimo interesse del veterinario alla
              tenuta dei propri registri professionali.
            </li>
            <li>
              Registro delle attività erogate (data, tipologia, durata, importo, note).
              Base giuridica: obblighi contabili e fiscali del veterinario.
            </li>
            <li>
              Conti (riepiloghi pro-forma di importi da fatturare): documento NON
              fiscalmente valido. Base giuridica: legittimo interesse alla
              rendicontazione interna.
            </li>
            <li>
              Registro delle azioni privilegiate (audit log). Base giuridica: obbligo di
              accountability ai sensi dell&apos;art. 5(2) GDPR.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-medium">Responsabili esterni (sub-responsabili)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Google Ireland Ltd / Google LLC — Firebase Authentication, Cloud Firestore,
              Cloud Functions, Cloud Logging. Regione di archiviazione di Firestore e
              delle Cloud Functions principali: <strong>europe-west8 (Milano)</strong>.
            </li>
            <li>
              Cloudflare, Inc. — distribuzione dei contenuti statici della web app
              (CDN/Workers Static Assets).
            </li>
            <li>
              Google LLC — Google Drive, usato come destinazione delle copie di
              backup giornaliere del database. La regione di archiviazione delle
              copie dipende dall&apos;account Google Workspace configurato.
            </li>
          </ul>
          <p>
            Firebase Authentication può comportare un trasferimento di dati di
            autenticazione (email) verso server gestiti da Google al di fuori dello
            Spazio Economico Europeo. Il trasferimento è coperto dalle Clausole
            Contrattuali Standard (SCC) della Commissione europea ai sensi dell&apos;art. 46
            GDPR.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-medium">Conservazione</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Attività, aziende, promemoria, tipi di attività: per la durata
              dell&apos;utilizzo del servizio e fino a 7 giorni dopo la cancellazione
              tramite il cestino (eliminazione automatica).
            </li>
            <li>
              Conti pro-forma: per la durata dell&apos;utilizzo del servizio; non soggetti
              all&apos;obbligo decennale di conservazione delle fatture (non sono fatture
              elettroniche).
            </li>
            <li>
              Audit log: conservato per finalità di accountability per la durata
              dell&apos;utilizzo del servizio.
            </li>
            <li>
              Copie di backup su Google Drive: conservate per 7 giorni, con
              rotazione automatica delle cartelle giornaliere.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-medium">Diritti dell&apos;interessato</h2>
          <p>
            È possibile esercitare in qualsiasi momento i diritti previsti dagli artt.
            15-22 GDPR: accesso, rettifica, cancellazione, limitazione, portabilità,
            opposizione. La funzione &quot;Elimina i miei dati&quot; nella pagina
            <em> Impostazioni</em> attua il diritto all&apos;oblio (art. 17 GDPR):
            elimina o anonimizza le attività, le aziende, i promemoria, i conti e
            l&apos;identità del veterinario, mantenendo i soli campi necessari ai conti
            pro-forma con titolare anonimizzato.
          </p>
          <p>
            Per esercitare altri diritti, scrivere a{" "}
            <a
              href="mailto:stefano.valloncini@gmail.com"
              className="text-(--color-accent) underline-offset-4 hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-background)"
            >
              stefano.valloncini@gmail.com
            </a>
            .
          </p>
          <p>
            È sempre possibile presentare reclamo al Garante per la protezione dei dati
            personali (
            <a
              href="https://www.garanteprivacy.it/"
              rel="noopener noreferrer"
              target="_blank"
              className="text-(--color-accent) underline-offset-4 hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-background)"
            >
              garanteprivacy.it
            </a>
            ).
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-medium">Cookie e tecnologie analoghe</h2>
          <p>
            L&apos;applicazione utilizza esclusivamente cookie tecnici e archiviazione
            locale necessari per autenticazione e funzionamento offline. Non sono
            utilizzati cookie di profilazione, analitici di terze parti o pubblicitari.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-medium">Decisioni automatizzate</h2>
          <p>
            Il servizio non esegue processi decisionali automatizzati che producano
            effetti giuridici sull&apos;interessato (art. 22 GDPR).
          </p>
        </section>

        <footer className="pt-4 border-t border-(--color-border) text-xs text-(--color-text-subtle)">
          Ultima revisione: 26 maggio 2026.
        </footer>
      </div>
    </main>
  );
}
