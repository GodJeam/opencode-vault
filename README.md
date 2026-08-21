# Opencode Vault

Plugin per **Obsidian** che integra **opencode** direttamente nel tuo vault: chatta con opencode, analizza note, allega file e gestisci le sessioni senza uscire da Obsidian.

> **Nota**: questo progetto è stato interamente generato utilizzando modelli di linguaggio (LLM) tramite opencode. Il codice ha ricevuto **poca revisione personale**: usalo con la dovuta cautela, testalo e segnala o correggi eventuali problemi.

## Funzionalità

- **Chat con opencode** in un pannello di Obsidian, con risposte in streaming e rendering Markdown.
- **Comandi rapidi**: `/` per i comandi (modello, nuova sessione, nota corrente, allega file, statistiche, pin, rinomina), `@` per allegare file del vault, `!` per le azioni rapide.
- **Selettore modello** integrato nel box del prompt (lista inline come in opencode desktop).
- **Sessioni multiple**: più finestre di chat affiancate, ognuna con la propria sessione.
- **Gestione sessioni**: pin, rinomina, elimina; la lista mostra le sessioni pinnate + le 10 più recenti.
- **Cronologia persistente** delle sessioni salvata in Obsidian (ultimi 100 messaggi per sessione).
- **Ragionamento e passi eseguiti**: mostra il reasoning e gli strumenti usati (con input/output apribili).
- **Token e costi**: statistiche per messaggio e totali (5 ore, settimana, mese).
- **Continuazione oltre il limite di contesto**: se una sessione raggiunge il limite di token, comando per riassumere/continuare in una nuova sessione (con fallback sulla cronologia locale).
- **Rendering TikZ**: anteprima e rendering dei blocchi ```tikz (e tikzcd/pgfplots) nelle note e nella chat, usando il TeX locale (MiKTeX) con supporto a tutte le librerie.

## Requisiti

- Obsidian (desktop, Windows/macOS/Linux)
- CLI di opencode installato e raggiungibile (es. `npm install -g opencode-ai`), con provider autenticati (`opencode auth login`)

### Requisiti per piattaforma

Il plugin è cross-platform: la chat, le sessioni, i comandi `/ @ !`, le statistiche e la gestione della cronologia funzionano su **Windows, macOS e Linux**.

Per **tutte** le piattaforme:
- **Node.js** (per compilare il plugin) e il **CLI di opencode** nel `PATH`.

Per il **rendering TikZ** (funzionalità aggiuntiva), serve un **TeX** locale:

| Piattaforma | TeX consigliato | Note |
|---|---|---|
| Windows | MiKTeX | percorso dei binari `latex`/`dvisvgm` da impostare nelle impostazioni del plugin se non sono nel PATH |
| macOS | MacTeX / TeX Live | binari di solito in `/Library/TeX/texbin` |
| Linux | TeX Live (`texlive-full`) | binari di solito in `/usr/bin` |

Il rendering TikZ usa `latex` + `dvisvgm`: assicurati che entrambi siano installati e raggiungibili, oppure configurane il percorso nelle impostazioni del plugin.

### Requisiti per il build

```bash
npm install
npm run build
```

## Installazione

1. Clona la repo e compila:

```bash
git clone https://github.com/<tuo-username>/opencode-vault.git
cd opencode-vault
npm install
npm run build
```

2. Copia i file generati nel vault:

```
<vault>/.obsidian/plugins/opencode-vault/
    ├── main.js
    ├── manifest.json
    └── styles.css
```

3. In Obsidian: Impostazioni → Plugin della community → abilita **Opencode Vault**.

## Uso

- Apri la chat dall'icona nella barra laterale o dalla palette comandi (`Ctrl+P` → "Nuova chat opencode").
- Nelle impostazioni del plugin verifica il percorso del binario (default `opencode`) e il modello.
- Con **"Continua in una nuova sessione (riassumendo)"** puoi proseguire quando una sessione satura il contesto.

## Struttura

- `src/main.ts` — entry point e comandi
- `src/chatView.ts` — vista chat e UI
- `src/opencodeRunner.ts` — esecuzione del CLI e parsing degli eventi
- `src/settings.ts` — impostazioni
- `src/modals.ts` — finestre modali (rinomina, statistiche, conferma, allegati)
- `src/tikzRenderer.ts` / `src/tikzPreview.ts` — rendering e anteprima TikZ

## Licenza

MIT — vedi [LICENSE](LICENSE).

## Disclaimer

Codice generato con LLM (opencode) con minima revisione manuale. Non garantito, fornito così com'è.
