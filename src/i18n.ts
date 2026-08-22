export type Language = "en" | "it";

// English is the default and is used inline in the code. This map provides
// the Italian translations for the optional "it" language setting.
const IT: Record<string, string> = {
  // --- settings ---
  "Language": "Lingua",
  "Interface language. English is the default. Some command names update after reloading Obsidian.":
    "Lingua dell'interfaccia. L'inglese è il default. Alcuni nomi dei comandi si aggiornano dopo il ricaricamento di Obsidian.",
  "English": "Inglese",
  "Italian": "Italiano",
  "Binary path": "Percorso binario",
  "Command or full path to the opencode executable. Usually 'opencode' is enough if it is on your PATH. If you have issues, use the full path (e.g. on Windows .../npm/opencode.cmd, on macOS/Linux .../bin/opencode).":
    "Comando o percorso completo dell'eseguibile opencode. Di solito basta 'opencode' se è nel PATH. In caso di problemi usa il percorso completo (es. su Windows .../npm/opencode.cmd, su macOS/Linux .../bin/opencode).",
  "Model": "Modello",
  "Pick a model from the opencode list. The same selector is also available in the chat bar. The default uses the OpenCode Go provider (the same as the desktop app).":
    "Seleziona un modello dalla lista di opencode. Lo stesso selettore è disponibile anche nella barra della chat. Il default usa il provider OpenCode Go (lo stesso dell'app desktop).",
  "Refresh model list": "Aggiorna elenco modelli",
  "Reload the list of available models from opencode.": "Ricarica la lista dei modelli disponibili da opencode.",
  "Refresh": "Aggiorna",
  "Agent": "Agent",
  "The opencode agent to use (e.g. build, plan). Leave empty for the default.":
    "Agente opencode da usare (es. build, plan). Lascia vuoto per il default.",
  "e.g. build": "es. build",
  "Session ID": "Session ID",
  "The persistent session id used for the chat. It is managed automatically: the first time a new session starts, then it is reused. Empty = new session on the next message.":
    "ID della sessione persistente usata per la chat. Viene gestito automaticamente: la prima volta parte una sessione nuova, poi viene riusata. Vuoto = nuova sessione al prossimo messaggio.",
  "(automatic)": "(automatico)",
  "Reset session": "Azzera sessione",
  "Clear the saved session and start from scratch on the next message.":
    "Cancella la sessione salvata e riparte da zero al prossimo messaggio.",
  "Reset": "Azzera",
  "Session reset: the next message will start from a new session.":
    "Sessione azzerata: il prossimo messaggio partirà da una nuova sessione.",
  "Auto-approve permissions": "Auto-approve permessi",
  "Automatically allow the tool permissions (bash, file edits, etc.). In non-interactive mode opencode would deny everything without this flag. Turn it off for extra safety.":
    "Concede automaticamente i permessi degli strumenti (bash, edit file, ecc.). In modalità non interattiva opencode negherebbe tutto senza questo flag. Disattivalo per maggiore sicurezza.",
  "Show reasoning": "Mostra ragionamento",
  "Show the model's reasoning blocks (uses the --thinking flag).":
    "Mostra i blocchi di reasoning del modello (usa il flag --thinking).",
  "Show tool details": "Mostra dettagli degli strumenti",
  "Show the input and output of every tool executed during the request, in collapsible blocks.":
    "Mostra input e output di ogni strumento eseguito durante la richiesta, in blocchi apribili con un clic.",
  "Test connection": "Testa connessione",
  "Run 'opencode --version' to verify the binary is reachable.":
    "Esegue 'opencode --version' per verificare che il binario sia raggiungibile.",
  "Test": "Test",
  "Testing...": "Test in corso...",
  "Opencode found:": "Opencode trovato:",
  "Error:": "Errore:",
  "(default from opencode)": "(default di opencode)",
  "(custom)": "(personalizzato)",

  // --- main commands ---
  "New opencode chat": "Nuova chat opencode",
  "Open opencode chat": "Apri chat opencode",
  "Continue in a new session (by summarizing)": "Continua in una nuova sessione (riassumendo)",
  "Send selection to opencode": "Invia selezione a opencode",
  "No text selected": "Nessun testo selezionato",
  "Use the current note as context": "Usa la nota corrente come contesto",
  "No active note": "Nessuna nota attiva",
  "Analyze the current note with opencode": "Analizza la nota corrente con opencode",
  "Analyze the content of the attached note below: provide a summary, key points, possible links with other vault notes and suggestions to develop it.":
    "Analizza il contenuto della nota allegata qui sotto: fornisci un riassunto, i punti chiave, eventuali collegamenti con altre note del vault e suggerimenti per svilupparla.",
  "Reset the opencode session": "Azzera la sessione opencode",
  "Session reset.": "Sessione azzerata.",

  // --- chat view ---
  "You": "Tu",
  "Opencode": "Opencode",
  "Error": "Errore",
  "Copy text": "Copia testo",
  "Text copied.": "Testo copiato.",
  "Type a message for opencode... (Enter to send, Shift+Enter for a new line)":
    "Scrivi un messaggio per opencode... (Invio per inviare, Shift+Invio per andare a capo)",
  "Send": "Invia",
  "Stop": "Stop",
  "New session": "Nuova sessione",
  "Rename session": "Rinomina sessione",
  "Delete session": "Elimina sessione",
  "Pin/Unpin session": "Pina/Spilla la sessione",
  "Session stats (tokens and costs)": "Statistiche token e costi",
  "Attach file": "Allega file",
  "Current note": "Nota corrente",
  "Remove the attached context": "Rimuovi il contesto allegato",
  "Session pinned.": "Sessione pinnata.",
  "Session unpinned.": "Sessione rimossa dai pinnati.",
  "Select a session to pin.": "Seleziona una sessione da pinnare.",
  "Select a session to rename.": "Seleziona una sessione da rinominare.",
  "Select a session to delete.": "Seleziona una sessione da eliminare.",
  "The title cannot be empty.": "Il titolo non può essere vuoto.",
  "Session renamed.": "Sessione rinominata.",
  "Session deleted.": "Sessione eliminata.",
  "Do you want to delete the session \"$1\"? The history saved in Obsidian will also be removed.":
    "Vuoi eliminare la sessione \"$1\"? Verrà rimossa anche la cronologia salvata in Obsidian.",
  "Delete": "Elimina",
  "Cancel": "Annulla",
  "Context:": "Contesto:",
  "with context:": "con contesto:",
  "Note added to context.": "Nota aggiunta al contesto.",
  "Image attached: check that the selected model supports images (vision).":
    "Immagine allegata: verifica che il modello selezionato supporti le immagini (vision).",
  "New session: the next message will start from scratch.":
    "Nuova sessione: il prossimo messaggio partirà da zero.",
  "There is already a request in progress.": "C'è già una richiesta in corso.",
  "Select first the session to summarize.": "Seleziona prima la sessione da riassumere.",
  "Model set:": "Modello impostato:",
  "Select a model...": "Scegli un modello...",
  "navigate": "navigare",
  "attach": "allegare",
  "close": "chiudere",
  "Search a vault file to attach...": "Cerca un file del vault da allegare...",
  "New title": "Nuovo titolo",
  "Save": "Salva",
  "Token usage and costs": "Utilizzo token e costi",
  "Loading...": "Caricamento...",
  "Last 5 hours": "Ultime 5 ore",
  "Last week": "Ultima settimana",
  "Last month": "Ultimo mese",
  "Input tokens": "Token input",
  "Output tokens": "Token output",
  "Total tokens": "Totale token",
  "Cost": "Costo",
  "Generating session summary...": "Generazione riassunto della sessione...",
  "The session summary could not be generated.": "Riassunto della sessione non riuscito.",
  "Starting...": "In avvio...",
  "Details": "Dettagli",
  "Reasoning": "Ragionamento",
  "Tool": "Strumento",
  "INPUT:": "INPUT:",
  "OUTPUT:": "OUTPUT:",
  "(no details)": "(nessun dettaglio)",
  "events": "eventi",
  "Token:": "Token:",
  "in": "in",
  "out": "out",
  "Cost:": "Costo:",
  "The selected model does not support images. Remove the attached image or choose a multimodal (vision) model from the Model menu.":
    "Il modello selezionato non supporta le immagini. Rimuovi l'allegato immagine oppure scegli un modello multimodale (con supporto vision) dal menu Modello.",
  "The saved session no longer exists: a new one will be created, resend the message.":
    "La sessione salvata non esiste più: ne verrà creata una nuova, rispedisci il messaggio.",
  "The opencode process exited with code $1. Check the binary path and the model in the settings.":
    "Il processo opencode è terminato con codice $1. Verifica il percorso del binario e il modello nelle impostazioni.",
  "Session at the limit: new session created with the recent history.":
    "Sessione al limite: nuova sessione creata con la cronologia recente.",
  "New session created with the summary of the previous one.":
    "Nuova sessione creata con il riassunto della precedente.",
  "[SUMMARY OF THE PREVIOUS SESSION]": "[RIASSUNTO DELLA SESSIONE PRECEDENTE]",
  "[RECENT HISTORY OF THE PREVIOUS SESSION]": "[CRONOLOGIA RECENTE DELLA SESSIONE PRECEDENTE]",
  "Continue the work from here.": "Continua il lavoro da qui.",
  "Continue the work from the previous session.": "Continua il lavoro dalla sessione precedente.",
  "Continue the work from here, keeping the context above in mind.":
    "Continua il lavoro da qui, tenendo conto del contesto sopra.",
  "The previous session has no saved history. Continue the work from here.":
    "La sessione precedente non ha una cronologia salvata. Continua il lavoro da qui.",
  "User": "Utente",

  // --- suggestions ---
  "/model": "/modello",
  "Change the model": "Cambia il modello",
  "/new": "/nuova",
  "/note": "/nota",
  "Attach the current note": "Allega la nota corrente",
  "/attach": "/allega",
  "Attach a file": "Allega un file",
  "Token and cost statistics": "Statistiche token e costi",
  "/pin": "/pin",
  "/rename": "/rinomina",
  "Attached": "Allegato",
  "current note": "nota corrente",
  "Attach the open note as context": "Allega la nota aperta come contesto",
  "attach file": "allega file",
  "Pick a file to attach": "Scegli un file da allegare",
  "new session": "nuova sessione",
  "Start from an empty session": "Parti da una sessione vuota",
  "statistics": "statistiche",
  "Tokens and costs (5h, week, month)": "Token e costi (5h, settimana, mese)",
  "pin/unpin session": "pina/spilla sessione",
  "Pin the session in the list": "Fissa la sessione nella lista",
  "active model": "modello attivo",
  "Hi! I am the plugin that connects your vault to opencode. Write a message below. Try the commands: / for commands, @ to attach a file, ! for quick actions.":
    "Ciao! Sono il plugin che collega il tuo vault a opencode. Scrivi un messaggio qui sotto. Prova i comandi: / per i comandi, @ per allegare un file, ! per le azioni rapide.",
  "Summarize in detail this conversation: goals, decisions made, work done, current state and next steps. Write the summary so the work can continue in a new session without losing context.":
    "Riassumi in dettaglio questa conversazione: obiettivi, decisioni prese, lavoro svolto, stato attuale e prossimi passi. Scrivi il riassunto in modo che si possa continuare il lavoro in una nuova sessione senza perdere il contesto.",
};

export function translate(lang: Language, text: string): string {
  if (lang === "it") return IT[text] ?? text;
  return text;
}