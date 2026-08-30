var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => OpencodePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/chatView.ts
var import_obsidian3 = require("obsidian");

// src/settings.ts
var import_obsidian2 = require("obsidian");

// src/modals.ts
var import_obsidian = require("obsidian");
var RenameModal = class extends import_obsidian.Modal {
  constructor(app, plugin, current, onSubmit) {
    super(app);
    this.plugin = plugin;
    this.current = current;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    const t = (s) => this.plugin.t(s);
    contentEl.empty();
    contentEl.createEl("h3", { text: t("Rename session") });
    let input;
    new import_obsidian.Setting(contentEl).setName(t("New title")).addText((txt) => {
      input = txt.inputEl;
      txt.setValue(this.current);
      txt.inputEl.select();
    });
    new import_obsidian.Setting(contentEl).addButton(
      (b) => b.setButtonText(t("Save")).setCta().onClick(() => {
        if (!input) return;
        const v = input.value.trim();
        if (!v) {
          new import_obsidian.Notice(t("The title cannot be empty."));
          return;
        }
        this.onSubmit(v);
        this.close();
      })
    ).addButton((b) => b.setButtonText(t("Cancel")).onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var StatsModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    const t = (s) => this.plugin.t(s);
    contentEl.empty();
    contentEl.createEl("h3", { text: t("Token usage and costs") });
    const status = contentEl.createDiv({ cls: "opencode-stats-loading", text: t("Loading...") });
    this.plugin.runner.getUsageStats().then((s) => {
      status.remove();
      this.renderWindow(contentEl, t("Last 5 hours"), s.h5);
      this.renderWindow(contentEl, t("Last week"), s.week);
      this.renderWindow(contentEl, t("Last month"), s.month);
    }).catch((e) => {
      status.setText(`${t("Error:")} ${e.message}`);
    });
  }
  renderWindow(container, label, w) {
    const locale = this.plugin.settings.language === "it" ? "it-IT" : "en-US";
    const t = (s) => this.plugin.t(s);
    container.createEl("h4", { text: label });
    new import_obsidian.Setting(container).setName(t("Input tokens")).setDesc(w.input.toLocaleString(locale));
    new import_obsidian.Setting(container).setName(t("Output tokens")).setDesc(w.output.toLocaleString(locale));
    new import_obsidian.Setting(container).setName(t("Total tokens")).setDesc((w.input + w.output).toLocaleString(locale));
    new import_obsidian.Setting(container).setName(t("Cost")).setDesc(`${w.cost.toFixed(4)} $`);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ConfirmModal = class extends import_obsidian.Modal {
  constructor(app, plugin, title, message, confirmLabel, onConfirm) {
    super(app);
    this.plugin = plugin;
    this.title = title;
    this.message = message;
    this.confirmLabel = confirmLabel;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    const t = (s) => this.plugin.t(s);
    contentEl.empty();
    contentEl.createEl("h3", { text: this.title });
    contentEl.createDiv({ cls: "opencode-confirm-message", text: this.message });
    new import_obsidian.Setting(contentEl).addButton(
      (b) => b.setButtonText(this.confirmLabel).setWarning().onClick(() => {
        this.onConfirm();
        this.close();
      })
    ).addButton((b) => b.setButtonText(t("Cancel")).onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var PromptModal = class extends import_obsidian.Modal {
  constructor(app, plugin, initialName, initialText, onSave) {
    super(app);
    this.plugin = plugin;
    this.initialName = initialName;
    this.initialText = initialText;
    this.onSave = onSave;
  }
  onOpen() {
    const { contentEl } = this;
    const t = (s) => this.plugin.t(s);
    contentEl.empty();
    contentEl.createEl("h3", { text: t("Prompt") });
    let nameInput;
    let textArea;
    new import_obsidian.Setting(contentEl).setName(t("Prompt name")).addText((x) => {
      nameInput = x.inputEl;
      x.setValue(this.initialName);
    });
    new import_obsidian.Setting(contentEl).setName(t("Prompt text")).addTextArea((x) => {
      textArea = x.inputEl;
      x.setValue(this.initialText);
      x.inputEl.rows = 10;
    });
    new import_obsidian.Setting(contentEl).addButton(
      (b) => b.setButtonText(t("Save")).setCta().onClick(() => {
        if (!nameInput || !textArea) return;
        const name = nameInput.value.trim();
        const text = textArea.value;
        if (!name || !text) {
          new import_obsidian.Notice(t("The prompt cannot be empty."));
          return;
        }
        this.onSave(name, text);
        this.close();
      })
    ).addButton((b) => b.setButtonText(t("Cancel")).onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var FileSuggestModal = class extends import_obsidian.SuggestModal {
  constructor(app, plugin, onPick) {
    super(app);
    this.plugin = plugin;
    this.onPick = onPick;
    const t = (s) => this.plugin.t(s);
    this.setPlaceholder(t("Search a vault file to attach..."));
    this.setInstructions([
      { command: "\u2191\u2193", purpose: t("navigate") },
      { command: "\u21B5", purpose: t("attach") },
      { command: "esc", purpose: t("close") }
    ]);
  }
  getItems() {
    return this.app.vault.getFiles().sort((a, b) => a.path.localeCompare(b.path));
  }
  getSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q) return this.getItems();
    return this.getItems().filter((f) => f.path.toLowerCase().includes(q));
  }
  renderSuggestion(file, el) {
    el.createEl("div", { text: file.path });
  }
  onChooseSuggestion(file) {
    this.onPick(file);
  }
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  language: "en",
  binaryPath: "opencode",
  anydocEnabled: true,
  anydocBinary: "anydoc",
  model: "opencode-go/deepseek-v4-flash",
  agent: "",
  autoApprove: true,
  showThinking: false,
  showToolIO: true,
  sessionId: "",
  pinned: [],
  prompts: [],
  dbAutoCleanup: true,
  dbCleanupMaxMB: 5,
  dbCleanupAgeDays: 7,
  maxAttachMB: 20
};
var OpencodeSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    var _a;
    const { containerEl } = this;
    const t = (s) => this.plugin.t(s);
    containerEl.empty();
    containerEl.createEl("h2", { text: "Opencode Vault" });
    new import_obsidian2.Setting(containerEl).setName(t("Language")).setDesc(t(
      "Interface language. English is the default. Some command names update after reloading Obsidian."
    )).addDropdown(
      (dd) => dd.addOption("en", t("English")).addOption("it", t("Italian")).setValue(this.plugin.settings.language).onChange(async (value) => {
        this.plugin.settings.language = value;
        await this.plugin.saveSettings();
        new import_obsidian2.Notice(t("Language changed. Reload Obsidian to apply it everywhere."));
        this.display();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Binary path")).setDesc(t(
      "Command or full path to the opencode executable. Usually 'opencode' is enough if it is on your PATH. If you have issues, use the full path (e.g. on Windows .../npm/opencode.cmd, on macOS/Linux .../bin/opencode)."
    )).addText(
      (text) => text.setPlaceholder("opencode").setValue(this.plugin.settings.binaryPath).onChange(async (value) => {
        this.plugin.settings.binaryPath = value.trim() || "opencode";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Convert documents with anydoc")).setDesc(t(
      "Run anydoc on attached documents (PDF, Word, Excel, etc.) and attach them as Markdown instead of the original file. Install with: npm install -g @firecrawl/anydoc"
    )).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.anydocEnabled).onChange(async (value) => {
        this.plugin.settings.anydocEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Anydoc binary path")).setDesc(t("Command or full path to the anydoc executable (npm install -g @firecrawl/anydoc).")).addText(
      (text) => text.setPlaceholder("anydoc").setValue(this.plugin.settings.anydocBinary).onChange(async (value) => {
        this.plugin.settings.anydocBinary = value.trim() || "anydoc";
        await this.plugin.saveSettings();
      })
    );
    const modelSetting = new import_obsidian2.Setting(containerEl).setName(t("Model")).setDesc(t(
      "Pick a model from the opencode list. The same selector is also available in the chat bar. The default uses the OpenCode Go provider (the same as the desktop app)."
    ));
    modelSetting.addDropdown((dd) => {
      this.populateModelDropdown(dd);
    });
    new import_obsidian2.Setting(containerEl).setName(t("Refresh model list")).setDesc(t("Reload the list of available models from opencode.")).addButton(
      (btn) => btn.setButtonText(t("Refresh")).onClick(() => {
        this.display();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Agent")).setDesc(t("The opencode agent to use (e.g. build, plan). Leave empty for the default.")).addText(
      (text) => text.setPlaceholder(t("e.g. build")).setValue(this.plugin.settings.agent).onChange(async (value) => {
        this.plugin.settings.agent = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Session ID")).setDesc(t(
      "The persistent session id used for the chat. It is managed automatically: the first time a new session starts, then it is reused. Empty = new session on the next message."
    )).addText(
      (text) => text.setPlaceholder(t("(automatic)")).setValue(this.plugin.settings.sessionId).onChange(async (value) => {
        this.plugin.settings.sessionId = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Reset session")).setDesc(t("Clear the saved session and start from scratch on the next message.")).addButton(
      (btn) => btn.setButtonText(t("Reset")).onClick(async () => {
        this.plugin.settings.sessionId = "";
        await this.plugin.saveSettings();
        new import_obsidian2.Notice(t("Session reset: the next message will start from a new session."));
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Auto-approve permissions")).setDesc(t(
      "Automatically allow the tool permissions (bash, file edits, etc.). In non-interactive mode opencode would deny everything without this flag. Turn it off for extra safety."
    )).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoApprove).onChange(async (value) => {
        this.plugin.settings.autoApprove = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Show reasoning")).setDesc(t("Show the model's reasoning blocks (uses the --thinking flag).")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showThinking).onChange(async (value) => {
        this.plugin.settings.showThinking = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Show tool details")).setDesc(t(
      "Show the input and output of every tool executed during the request, in collapsible blocks."
    )).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showToolIO).onChange(async (value) => {
        this.plugin.settings.showToolIO = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h2", { text: t("Database self-cleanup") });
    new import_obsidian2.Setting(containerEl).setName(t("Enable automatic cleanup")).setDesc(t(
      "Periodically remove large file attachments from the opencode database (opencode.db), which would otherwise bloat it. Only file attachments older than the minimum age and larger than the max size are removed; conversation text is never touched."
    )).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.dbAutoCleanup).onChange(async (value) => {
        this.plugin.settings.dbAutoCleanup = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Max part size (MB)")).setDesc(t("File attachments larger than this (in the database) are removed.")).addText(
      (text) => text.setPlaceholder("5").setValue(String(this.plugin.settings.dbCleanupMaxMB)).onChange(async (value) => {
        const n = parseInt(value, 10);
        this.plugin.settings.dbCleanupMaxMB = Number.isFinite(n) && n > 0 ? n : 5;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Minimum age (days)")).setDesc(t("Only attachments older than this are removed, so recent files stay available.")).addText(
      (text) => text.setPlaceholder("7").setValue(String(this.plugin.settings.dbCleanupAgeDays)).onChange(async (value) => {
        const n = parseInt(value, 10);
        this.plugin.settings.dbCleanupAgeDays = Number.isFinite(n) && n >= 0 ? n : 7;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Max attachment size (MB)")).setDesc(t(
      "When anydoc fails to convert a document, files larger than this are not attached to the request, to avoid storing unusable copies in the database."
    )).addText(
      (text) => text.setPlaceholder("20").setValue(String(this.plugin.settings.maxAttachMB)).onChange(async (value) => {
        const n = parseInt(value, 10);
        this.plugin.settings.maxAttachMB = Number.isFinite(n) && n > 0 ? n : 20;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(t("Run cleanup now")).setDesc(t("Remove oversized file attachments immediately, regardless of age.")).addButton(
      (btn) => btn.setButtonText(t("Cleanup")).onClick(async () => {
        btn.setDisabled(true);
        btn.setButtonText(t("Cleaning..."));
        try {
          await this.plugin.runner.pruneOversizedParts(true);
          new import_obsidian2.Notice(t("Cleanup done."));
        } catch (e) {
          new import_obsidian2.Notice(`${t("Error:")} ${e.message}`);
        } finally {
          btn.setDisabled(false);
          btn.setButtonText(t("Cleanup"));
        }
      })
    );
    containerEl.createEl("h2", { text: t("Prompt templates") });
    const prompts = (_a = this.plugin.settings.prompts) != null ? _a : [];
    if (prompts.length === 0) {
      containerEl.createDiv({
        text: t("No saved prompts \u2014 add them in Settings"),
        cls: "opencode-stats-loading"
      });
    }
    for (let i = 0; i < prompts.length; i++) {
      const p = prompts[i];
      const s = new import_obsidian2.Setting(containerEl).setName(p.name || t("(untitled)")).setDesc(p.text.length > 120 ? p.text.slice(0, 117) + "\u2026" : p.text);
      s.addButton(
        (b) => b.setButtonText(t("Edit")).onClick(() => this.editPrompt(i))
      );
      s.addButton(
        (b) => b.setButtonText(t("Delete")).setWarning().onClick(async () => {
          this.plugin.settings.prompts.splice(i, 1);
          await this.plugin.saveSettings();
          this.display();
        })
      );
    }
    new import_obsidian2.Setting(containerEl).addButton(
      (b) => b.setButtonText(t("Add prompt")).setCta().onClick(() => this.editPrompt(-1))
    );
    new import_obsidian2.Setting(containerEl).setName(t("Test connection")).setDesc(t("Run 'opencode --version' to verify the binary is reachable.")).addButton(
      (btn) => btn.setButtonText(t("Test")).onClick(async () => {
        btn.setDisabled(true);
        btn.setButtonText(t("Testing..."));
        try {
          const version = await this.plugin.runner.getVersion();
          new import_obsidian2.Notice(`${t("Opencode found:")} ${version}`);
        } catch (e) {
          new import_obsidian2.Notice(`${t("Error:")} ${e.message}`);
        } finally {
          btn.setDisabled(false);
          btn.setButtonText(t("Test"));
        }
      })
    );
  }
  editPrompt(index) {
    var _a;
    const prompts = (_a = this.plugin.settings.prompts) != null ? _a : [];
    const existing = index >= 0 ? prompts[index] : null;
    new PromptModal(
      this.app,
      this.plugin,
      existing ? existing.name : "",
      existing ? existing.text : "",
      (name, text) => {
        if (existing) {
          existing.name = name;
          existing.text = text;
        } else {
          prompts.push({ name, text });
        }
        void this.plugin.saveSettings();
        this.display();
      }
    ).open();
  }
  async populateModelDropdown(dd) {
    const t = (s) => this.plugin.t(s);
    const cur = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    const seen = /* @__PURE__ */ new Set();
    const addOption = (value, display) => {
      if (seen.has(value)) return;
      seen.add(value);
      dd.addOption(value, display);
    };
    addOption("", t("(default from opencode)"));
    if (cur) addOption(cur, cur + (cur.includes("/") ? "" : ` ${t("(custom)")}`));
    dd.setValue(cur || "");
    try {
      const models = await this.plugin.runner.listModels();
      for (const m of models) addOption(m, m);
      dd.setValue(cur || "");
    } catch (e) {
      addOption("", `${t("Error:")} ${e.message}`);
    }
  }
};

// src/i18n.ts
var IT = {
  // --- settings ---
  "Language": "Lingua",
  "Interface language. English is the default. Some command names update after reloading Obsidian.": "Lingua dell'interfaccia. L'inglese \xE8 il default. Alcuni nomi dei comandi si aggiornano dopo il ricaricamento di Obsidian.",
  "Language changed. Reload Obsidian to apply it everywhere.": "Lingua cambiata. Ricarica Obsidian per applicarla ovunque.",
  "English": "Inglese",
  "Italian": "Italiano",
  "Binary path": "Percorso binario",
  "Convert documents with anydoc": "Converti i documenti con anydoc",
  "Run anydoc on attached documents (PDF, Word, Excel, etc.) and attach them as Markdown instead of the original file. Install with: npm install -g @firecrawl/anydoc": "Esegue anydoc sugli allegati documento (PDF, Word, Excel, ecc.) e li allega come Markdown invece del file originale. Installazione: npm install -g @firecrawl/anydoc",
  "Anydoc binary path": "Percorso binario anydoc",
  "Command or full path to the anydoc executable (npm install -g @firecrawl/anydoc).": "Comando o percorso completo dell'eseguibile anydoc (npm install -g @firecrawl/anydoc).",
  "anydoc conversion failed": "Conversione anydoc fallita",
  "Command or full path to the opencode executable. Usually 'opencode' is enough if it is on your PATH. If you have issues, use the full path (e.g. on Windows .../npm/opencode.cmd, on macOS/Linux .../bin/opencode).": "Comando o percorso completo dell'eseguibile opencode. Di solito basta 'opencode' se \xE8 nel PATH. In caso di problemi usa il percorso completo (es. su Windows .../npm/opencode.cmd, su macOS/Linux .../bin/opencode).",
  "Model": "Modello",
  "Pick a model from the opencode list. The same selector is also available in the chat bar. The default uses the OpenCode Go provider (the same as the desktop app).": "Seleziona un modello dalla lista di opencode. Lo stesso selettore \xE8 disponibile anche nella barra della chat. Il default usa il provider OpenCode Go (lo stesso dell'app desktop).",
  "Refresh model list": "Aggiorna elenco modelli",
  "Reload the list of available models from opencode.": "Ricarica la lista dei modelli disponibili da opencode.",
  "Refresh": "Aggiorna",
  "Agent": "Agent",
  "The opencode agent to use (e.g. build, plan). Leave empty for the default.": "Agente opencode da usare (es. build, plan). Lascia vuoto per il default.",
  "e.g. build": "es. build",
  "Session ID": "Session ID",
  "The persistent session id used for the chat. It is managed automatically: the first time a new session starts, then it is reused. Empty = new session on the next message.": "ID della sessione persistente usata per la chat. Viene gestito automaticamente: la prima volta parte una sessione nuova, poi viene riusata. Vuoto = nuova sessione al prossimo messaggio.",
  "(automatic)": "(automatico)",
  "Reset session": "Azzera sessione",
  "Clear the saved session and start from scratch on the next message.": "Cancella la sessione salvata e riparte da zero al prossimo messaggio.",
  "Reset": "Azzera",
  "Session reset: the next message will start from a new session.": "Sessione azzerata: il prossimo messaggio partir\xE0 da una nuova sessione.",
  "Auto-approve permissions": "Auto-approve permessi",
  "Automatically allow the tool permissions (bash, file edits, etc.). In non-interactive mode opencode would deny everything without this flag. Turn it off for extra safety.": "Concede automaticamente i permessi degli strumenti (bash, edit file, ecc.). In modalit\xE0 non interattiva opencode negherebbe tutto senza questo flag. Disattivalo per maggiore sicurezza.",
  "Show reasoning": "Mostra ragionamento",
  "Show the model's reasoning blocks (uses the --thinking flag).": "Mostra i blocchi di reasoning del modello (usa il flag --thinking).",
  "Show tool details": "Mostra dettagli degli strumenti",
  "Show the input and output of every tool executed during the request, in collapsible blocks.": "Mostra input e output di ogni strumento eseguito durante la richiesta, in blocchi apribili con un clic.",
  "Database self-cleanup": "Pulizia automatica del database",
  "Enable automatic cleanup": "Attiva pulizia automatica",
  "Periodically remove large file attachments from the opencode database (opencode.db), which would otherwise bloat it. Only file attachments older than the minimum age and larger than the max size are removed; conversation text is never touched.": "Rimuove periodicamente gli allegati file di grandi dimensioni dal database di opencode (opencode.db), che altrimenti si gonfia. Vengono rimossi solo gli allegati pi\xF9 vecchi dell'et\xE0 minima e pi\xF9 grandi della dimensione massima; il testo delle conversazioni non viene mai toccato.",
  "Max part size (MB)": "Dimensione massima parte (MB)",
  "File attachments larger than this (in the database) are removed.": "Gli allegati file pi\xF9 grandi di questo valore (nel database) vengono rimossi.",
  "Minimum age (days)": "Et\xE0 minima (giorni)",
  "Only attachments older than this are removed, so recent files stay available.": "Vengono rimossi solo gli allegati pi\xF9 vecchi di questo periodo, cos\xEC i file recenti restano disponibili.",
  "Max attachment size (MB)": "Dimensione massima allegato (MB)",
  "When anydoc fails to convert a document, files larger than this are not attached to the request, to avoid storing unusable copies in the database.": "Quando anydoc non riesce a convertire un documento, i file pi\xF9 grandi di questo valore non vengono allegati alla richiesta, per evitare di salvare copie inutilizzabili nel database.",
  "Run cleanup now": "Esegui pulizia ora",
  "Remove oversized file attachments immediately, regardless of age.": "Rimuove subito gli allegati file troppo grandi, indipendentemente dall'et\xE0.",
  "Cleanup": "Pulisci",
  "Cleaning...": "Pulizia in corso...",
  "Cleanup done.": "Pulizia completata.",
  "Attachment skipped: the file is larger than $1 MB and could not be converted, so it was not attached.": "Allegato saltato: il file \xE8 pi\xF9 grande di $1 MB e non \xE8 stato possibile convertirlo, quindi non \xE8 stato allegato.",
  "Test connection": "Testa connessione",
  "Run 'opencode --version' to verify the binary is reachable.": "Esegue 'opencode --version' per verificare che il binario sia raggiungibile.",
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
  "Analyze the content of the attached note below: provide a summary, key points, possible links with other vault notes and suggestions to develop it.": "Analizza il contenuto della nota allegata qui sotto: fornisci un riassunto, i punti chiave, eventuali collegamenti con altre note del vault e suggerimenti per svilupparla.",
  "Reset the opencode session": "Azzera la sessione opencode",
  "Session reset.": "Sessione azzerata.",
  // --- chat view ---
  "You": "Tu",
  "Opencode": "Opencode",
  "Error": "Errore",
  "Copy text": "Copia testo",
  "Text copied.": "Testo copiato.",
  "Type a message for opencode... (Enter to send, Shift+Enter for a new line)": "Scrivi un messaggio per opencode... (Invio per inviare, Shift+Invio per andare a capo)",
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
  "The title cannot be empty.": "Il titolo non pu\xF2 essere vuoto.",
  "Session renamed.": "Sessione rinominata.",
  "Session deleted.": "Sessione eliminata.",
  'Do you want to delete the session "$1"? The history saved in Obsidian will also be removed.': 'Vuoi eliminare la sessione "$1"? Verr\xE0 rimossa anche la cronologia salvata in Obsidian.',
  "Delete": "Elimina",
  "Cancel": "Annulla",
  "Context:": "Contesto:",
  "last update $1s ago": "ultimo aggiornamento $1s fa",
  "Possibly stuck": "Possibilmente bloccato",
  "with context:": "con contesto:",
  "Note added to context.": "Nota aggiunta al contesto.",
  "Image attached: check that the selected model supports images (vision).": "Immagine allegata: verifica che il modello selezionato supporti le immagini (vision).",
  "New session: the next message will start from scratch.": "Nuova sessione: il prossimo messaggio partir\xE0 da zero.",
  "There is already a request in progress.": "C'\xE8 gi\xE0 una richiesta in corso.",
  "Select first the session to summarize.": "Seleziona prima la sessione da riassumere.",
  "Model set:": "Modello impostato:",
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
  "The selected model does not support images. Remove the attached image or choose a multimodal (vision) model from the Model menu.": "Il modello selezionato non supporta le immagini. Rimuovi l'allegato immagine oppure scegli un modello multimodale (con supporto vision) dal menu Modello.",
  "The saved session no longer exists: a new one will be created, resend the message.": "La sessione salvata non esiste pi\xF9: ne verr\xE0 creata una nuova, rispedisci il messaggio.",
  "The opencode process exited with code $1. Check the binary path and the model in the settings.": "Il processo opencode \xE8 terminato con codice $1. Verifica il percorso del binario e il modello nelle impostazioni.",
  "Session at the limit: new session created with the recent history.": "Sessione al limite: nuova sessione creata con la cronologia recente.",
  "New session created with the summary of the previous one.": "Nuova sessione creata con il riassunto della precedente.",
  "[SUMMARY OF THE PREVIOUS SESSION]": "[RIASSUNTO DELLA SESSIONE PRECEDENTE]",
  "[RECENT HISTORY OF THE PREVIOUS SESSION]": "[CRONOLOGIA RECENTE DELLA SESSIONE PRECEDENTE]",
  "Continue the work from here.": "Continua il lavoro da qui.",
  "Continue the work from the previous session.": "Continua il lavoro dalla sessione precedente.",
  "Continue the work from here, keeping the context above in mind.": "Continua il lavoro da qui, tenendo conto del contesto sopra.",
  "The previous session has no saved history. Continue the work from here.": "La sessione precedente non ha una cronologia salvata. Continua il lavoro da qui.",
  "User": "Utente",
  "Unknown error": "Errore sconosciuto",
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
  "/prompt": "/prompt",
  "Insert a saved prompt": "Inserisci un prompt salvato",
  "Prompt templates": "Modelli di prompt",
  "Add prompt": "Aggiungi prompt",
  "Edit": "Modifica",
  "Prompt": "Prompt",
  "Prompt name": "Nome prompt",
  "Prompt text": "Testo prompt",
  "No saved prompts \u2014 add them in Settings": "Nessun prompt salvato \u2014 aggiungili nelle impostazioni",
  "The prompt cannot be empty.": "Il prompt non pu\xF2 essere vuoto.",
  "(untitled)": "(senza titolo)",
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
  "Hi! I am the plugin that connects your vault to opencode. Write a message below. Try the commands: / for commands, @ to attach a file, ! for quick actions.": "Ciao! Sono il plugin che collega il tuo vault a opencode. Scrivi un messaggio qui sotto. Prova i comandi: / per i comandi, @ per allegare un file, ! per le azioni rapide.",
  "Summarize in detail this conversation: goals, decisions made, work done, current state and next steps. Write the summary so the work can continue in a new session without losing context.": "Riassumi in dettaglio questa conversazione: obiettivi, decisioni prese, lavoro svolto, stato attuale e prossimi passi. Scrivi il riassunto in modo che si possa continuare il lavoro in una nuova sessione senza perdere il contesto."
};
function translate(lang, text) {
  var _a;
  if (lang === "it") return (_a = IT[text]) != null ? _a : text;
  return text;
}
function substitute(template, ...args) {
  return template.replace(/\$(\d+)/g, (_, n) => {
    var _a;
    return String((_a = args[Number(n) - 1]) != null ? _a : "");
  });
}

// src/chatView.ts
var CHAT_VIEW_TYPE = "opencode-chat-view";
var ChatView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    __publicField(this, "plugin");
    __publicField(this, "messagesEl");
    __publicField(this, "inputEl");
    __publicField(this, "contextBar");
    __publicField(this, "contextLabelEl");
    __publicField(this, "contextClearBtn");
    __publicField(this, "sessionSelect");
    __publicField(this, "pinBtn");
    __publicField(this, "renameBtn");
    __publicField(this, "deleteBtn");
    __publicField(this, "modelBtn");
    __publicField(this, "sendBtn");
    __publicField(this, "stopBtn");
    __publicField(this, "statsBar");
    __publicField(this, "contextEl");
    __publicField(this, "contextFillEl");
    __publicField(this, "attachmentsBar");
    __publicField(this, "suggestEl");
    __publicField(this, "attachments", []);
    __publicField(this, "viewSession");
    __publicField(this, "pendingUser", null);
    __publicField(this, "currentProc", null);
    __publicField(this, "running", false);
    __publicField(this, "context", null);
    __publicField(this, "renderTimer", null);
    __publicField(this, "hadStreamError", false);
    __publicField(this, "stoppedByUser", false);
    __publicField(this, "lastStderr", "");
    __publicField(this, "stats", { input: 0, output: 0, total: 0, cost: 0 });
    __publicField(this, "contextLimit", 0);
    __publicField(this, "contextUsed", 0);
    __publicField(this, "contextBaseInput", 0);
    __publicField(this, "contextRunInput", 0);
    __publicField(this, "activityTimer", null);
    __publicField(this, "suggestItems", []);
    __publicField(this, "suggestIndex", 0);
    __publicField(this, "suggestOpen", false);
    __publicField(this, "suggestTrigger", null);
    __publicField(this, "vaultPaths", null);
    this.plugin = plugin;
    this.viewSession = plugin.settings.sessionId;
  }
  getViewType() {
    return CHAT_VIEW_TYPE;
  }
  getDisplayText() {
    return "Opencode chat";
  }
  getIcon() {
    return "bot";
  }
  async onOpen() {
    const container = this.contentEl;
    container.empty();
    container.addClass("opencode-chat");
    this.messagesEl = container.createDiv({ cls: "opencode-messages" });
    this.buildContextBar(container);
    this.buildAttachmentsBar(container);
    this.buildStatsBar(container);
    this.buildInputArea(container);
    void this.populateSessionSelect().then(() => {
      this.loadHistoryForSession(this.viewSession);
    });
  }
  onClose() {
    var _a;
    (_a = this.currentProc) == null ? void 0 : _a.abort();
    this.currentProc = null;
    return super.onClose();
  }
  setContext(ctx) {
    this.context = ctx;
    this.updateContextBar();
  }
  focusInput() {
    var _a;
    (_a = this.inputEl) == null ? void 0 : _a.focus();
  }
  sendText(text) {
    if (this.inputEl) this.inputEl.value = text;
    this.send();
  }
  buildContextBar(container) {
    this.contextBar = container.createDiv({ cls: "opencode-context-bar" });
    this.contextLabelEl = this.contextBar.createSpan({ cls: "opencode-context-label" });
    this.contextClearBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn hidden",
      attr: { title: this.plugin.t("Remove the attached context") }
    });
    (0, import_obsidian3.setIcon)(this.contextClearBtn, "x");
    this.contextClearBtn.addEventListener("click", () => {
      this.context = null;
      this.updateContextBar();
    });
    this.contextBar.createSpan({ cls: "opencode-context-spacer" });
    this.sessionSelect = this.contextBar.createEl("select", {
      cls: "opencode-session-select"
    });
    this.sessionSelect.addEventListener("change", () => {
      const v = this.sessionSelect.value;
      if (v !== this.viewSession) {
        this.viewSession = v;
        this.plugin.settings.sessionId = v;
        void this.plugin.saveSettings();
        this.loadHistoryForSession(v);
      }
      this.updateSessionBtnStates();
    });
    void this.populateSessionSelect();
    this.pinBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: this.plugin.t("Pin/Unpin session") }
    });
    (0, import_obsidian3.setIcon)(this.pinBtn, "pin");
    this.pinBtn.addEventListener("click", () => this.togglePin());
    this.renameBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: this.plugin.t("Rename session") }
    });
    (0, import_obsidian3.setIcon)(this.renameBtn, "pencil");
    this.renameBtn.addEventListener("click", () => this.renameCurrentSession());
    this.deleteBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: this.plugin.t("Delete session") }
    });
    (0, import_obsidian3.setIcon)(this.deleteBtn, "trash");
    this.deleteBtn.addEventListener("click", () => this.deleteCurrentSession());
    const statsBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: this.plugin.t("Token and cost statistics") }
    });
    (0, import_obsidian3.setIcon)(statsBtn, "bar-chart-3");
    statsBtn.addEventListener("click", () => new StatsModal(this.app, this.plugin).open());
    const attachBtn = this.contextBar.createEl("button", { cls: "opencode-add-note-btn" });
    attachBtn.setText("\uFF0B " + this.plugin.t("Attach file"));
    attachBtn.addEventListener("click", () => this.openFilePicker());
    const add = this.contextBar.createEl("button", { cls: "opencode-add-note-btn" });
    add.setText("+ " + this.plugin.t("Current note"));
    add.addEventListener("click", () => this.attachCurrentNote());
    this.updateContextBar();
  }
  buildAttachmentsBar(container) {
    this.attachmentsBar = container.createDiv({ cls: "opencode-attachments-bar hidden" });
    this.updateAttachmentsBar();
  }
  updateAttachmentsBar() {
    if (!this.attachmentsBar) return;
    this.attachmentsBar.empty();
    if (this.attachments.length === 0) {
      this.attachmentsBar.addClass("hidden");
      return;
    }
    this.attachmentsBar.removeClass("hidden");
    for (const a of this.attachments) {
      const chip = this.attachmentsBar.createSpan({ cls: "opencode-attachment-chip" });
      const icon = chip.createSpan({ cls: "opencode-attachment-icon" });
      (0, import_obsidian3.setIcon)(icon, a.image ? "image" : "file-text");
      chip.createSpan({ text: a.label, cls: "opencode-attachment-label" });
      const rm = chip.createEl("button", { cls: "opencode-icon-btn" });
      (0, import_obsidian3.setIcon)(rm, "x");
      rm.addEventListener("click", () => {
        this.attachments = this.attachments.filter((x) => x.path !== a.path);
        this.updateAttachmentsBar();
      });
    }
  }
  openFilePicker() {
    new FileSuggestModal(this.app, this.plugin, (file) => this.addAttachment(file.path)).open();
  }
  addAttachment(path) {
    if (this.attachments.some((a) => a.path === path)) return;
    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(path);
    this.attachments.push({ path, label: path, image: isImage });
    this.updateAttachmentsBar();
    if (isImage) {
      new import_obsidian3.Notice(
        this.plugin.t("Image attached: check that the selected model supports images (vision).")
      );
    }
  }
  togglePin() {
    var _a;
    const id = this.viewSession;
    if (!id) {
      new import_obsidian3.Notice(this.plugin.t("Select a session to pin."));
      return;
    }
    const pinned = (_a = this.plugin.settings.pinned) != null ? _a : [];
    const idx = pinned.indexOf(id);
    if (idx >= 0) pinned.splice(idx, 1);
    else pinned.push(id);
    this.plugin.settings.pinned = pinned;
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    new import_obsidian3.Notice(idx >= 0 ? this.plugin.t("Session unpinned.") : this.plugin.t("Session pinned."));
  }
  renameCurrentSession() {
    var _a, _b;
    const id = this.viewSession;
    if (!id) {
      new import_obsidian3.Notice(this.plugin.t("Select a session to rename."));
      return;
    }
    const current = (_b = (_a = this.sessionSelect.selectedOptions[0]) == null ? void 0 : _a.textContent) != null ? _b : id;
    new RenameModal(this.app, this.plugin, current, (newTitle) => {
      this.plugin.runner.renameSession(id, newTitle).then(() => {
        void this.populateSessionSelect();
        new import_obsidian3.Notice(this.plugin.t("Session renamed."));
      }).catch((e) => new import_obsidian3.Notice(`${this.plugin.t("Error:")} ${e.message}`));
    }).open();
  }
  deleteCurrentSession() {
    var _a, _b;
    const id = this.viewSession;
    if (!id) {
      new import_obsidian3.Notice(this.plugin.t("Select a session to delete."));
      return;
    }
    const title = (_b = (_a = this.sessionSelect.selectedOptions[0]) == null ? void 0 : _a.textContent) != null ? _b : id;
    new ConfirmModal(
      this.app,
      this.plugin,
      this.plugin.t("Delete session"),
      this.plugin.t('Do you want to delete the session "$1"? The history saved in Obsidian will also be removed.').replace("$1", title),
      this.plugin.t("Delete"),
      () => {
        this.plugin.runner.deleteSession(id).then(async () => {
          var _a2;
          await this.plugin.deleteHistory(id);
          const pinned = (_a2 = this.plugin.settings.pinned) != null ? _a2 : [];
          const pi = pinned.indexOf(id);
          if (pi >= 0) pinned.splice(pi, 1);
          this.plugin.settings.pinned = pinned;
          if (this.viewSession === id) this.viewSession = "";
          this.plugin.settings.sessionId = "";
          await this.plugin.saveSettings();
          await this.populateSessionSelect();
          this.loadHistoryForSession(this.viewSession);
          new import_obsidian3.Notice(this.plugin.t("Session deleted."));
        }).catch((e) => new import_obsidian3.Notice(`${this.plugin.t("Error:")} ${e.message}`));
      }
    ).open();
  }
  updateContextBar() {
    if (this.context) {
      this.contextLabelEl.setText(`${this.plugin.t("Context:")} ${this.context.label}`);
      this.contextLabelEl.show();
      this.contextClearBtn.removeClass("hidden");
    } else {
      this.contextLabelEl.setText("");
      this.contextLabelEl.hide();
      this.contextClearBtn.addClass("hidden");
    }
  }
  async populateSessionSelect() {
    var _a;
    const sel = this.sessionSelect;
    sel.empty();
    const newOpt = sel.createEl("option");
    newOpt.value = "";
    newOpt.textContent = "\uFF0B " + this.plugin.t("New session");
    try {
      const sessions = await this.plugin.runner.listSessions();
      sessions.sort((a, b) => {
        var _a2, _b;
        return ((_a2 = b.updated) != null ? _a2 : 0) - ((_b = a.updated) != null ? _b : 0);
      });
      const pinnedSet = new Set((_a = this.plugin.settings.pinned) != null ? _a : []);
      const pinned = sessions.filter((s) => pinnedSet.has(s.id));
      const recent = sessions.filter((s) => !pinnedSet.has(s.id)).slice(0, 10);
      for (const s of [...pinned, ...recent]) {
        const o = sel.createEl("option");
        o.value = s.id;
        const title = s.title || s.id;
        const mark = pinnedSet.has(s.id) ? "\u25CF " : "";
        o.textContent = mark + (title.length > 40 ? title.slice(0, 37) + "\u2B26" : title);
        o.title = title;
      }
    } catch (e) {
    }
    sel.value = this.viewSession || "";
    this.updateSessionBtnStates();
  }
  updateSessionBtnStates() {
    var _a;
    const hasSession = !!this.viewSession;
    this.renameBtn.disabled = !hasSession;
    this.deleteBtn.disabled = !hasSession;
    this.pinBtn.disabled = !hasSession;
    const pinned = ((_a = this.plugin.settings.pinned) != null ? _a : []).includes(this.viewSession);
    this.pinBtn.toggleClass("is-active", pinned);
  }
  buildStatsBar(container) {
    this.statsBar = container.createDiv({ cls: "opencode-stats-bar" });
    const ctx = this.statsBar.createSpan({ cls: "opencode-context" });
    const track = ctx.createSpan({ cls: "opencode-context-track" });
    this.contextFillEl = track.createSpan({ cls: "opencode-context-fill" });
    this.contextEl = ctx.createSpan({ cls: "opencode-context-text" });
    this.updateContextUsage();
    this.updateStatsBar();
  }
  updateStatsBar() {
    if (!this.statsBar) return;
    const existing = this.statsBar.querySelector(".opencode-stats-text");
    if (existing) existing.remove();
    this.statsBar.createSpan({
      text: this.fmtTokens(this.stats.total, this.stats.input, this.stats.output, this.stats.cost),
      cls: "opencode-stats-text"
    });
  }
  updateContextUsage() {
    if (!this.contextEl) return;
    const used = this.contextUsed;
    const limit = this.contextLimit;
    if (!limit) {
      this.contextEl.setText(this.plugin.t("Context:") + " \u2014");
      this.contextFillEl.style.width = "0%";
      return;
    }
    const pct = Math.min(100, Math.round(used / limit * 100));
    this.contextFillEl.style.width = pct + "%";
    this.contextEl.setText(
      `${this.plugin.t("Context:")} ${pct}% (${Math.round(used / 1e3)}K / ${Math.round(limit / 1e3)}K)`
    );
  }
  async refreshContext() {
    const sid = this.viewSession;
    if (!sid) {
      this.contextUsed = 0;
      this.contextLimit = 0;
      this.updateContextUsage();
      return;
    }
    try {
      const tokens = await this.plugin.runner.getSessionTokens(sid);
      this.contextBaseInput = tokens.input;
      this.contextUsed = tokens.input;
      if (!this.contextLimit) {
        const model = this.plugin.settings.model || DEFAULT_SETTINGS.model;
        this.contextLimit = await this.plugin.runner.getModelContextLimit(model);
      }
    } catch (e) {
      console.error("[opencode-vault] refreshContext error:", e);
    }
    this.updateContextUsage();
  }
  addStats(info) {
    var _a, _b, _c, _d;
    if (info.tokens) {
      this.stats.input += (_a = info.tokens.input) != null ? _a : 0;
      this.stats.output += (_b = info.tokens.output) != null ? _b : 0;
      this.stats.total += (_c = info.tokens.total) != null ? _c : 0;
    }
    this.stats.cost += (_d = info.cost) != null ? _d : 0;
    this.updateStatsBar();
  }
  resetStats() {
    this.stats = { input: 0, output: 0, total: 0, cost: 0 };
    this.updateStatsBar();
  }
  async attachCurrentNote() {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new import_obsidian3.Notice(this.plugin.t("No active note"));
      return;
    }
    const content = await this.app.vault.cachedRead(file);
    this.context = { label: file.path, content };
    this.updateContextBar();
    new import_obsidian3.Notice(this.plugin.t("Note added to context."));
  }
  buildInputArea(container) {
    const inputArea = container.createDiv({ cls: "opencode-input-area" });
    this.suggestEl = inputArea.createDiv({ cls: "opencode-suggest hidden" });
    this.inputEl = inputArea.createEl("textarea", {
      cls: "opencode-input",
      attr: {
        placeholder: this.plugin.t("Type a message for opencode... (Enter to send, Shift+Enter for a new line)")
      }
    });
    this.inputEl.addEventListener("keydown", (e) => this.onInputKeydown(e));
    this.inputEl.addEventListener("input", () => this.onInputChange());
    const buttons = inputArea.createDiv({ cls: "opencode-buttons" });
    this.modelBtn = buttons.createEl("button", { cls: "opencode-model-btn" });
    this.updateModelBtn();
    this.modelBtn.addEventListener("click", () => this.openModelList());
    buttons.createSpan({ cls: "opencode-buttons-spacer" });
    this.sendBtn = buttons.createEl("button", { cls: "opencode-send-btn" });
    this.sendBtn.setText(this.plugin.t("Send"));
    this.sendBtn.addEventListener("click", () => this.send());
    this.stopBtn = buttons.createEl("button", { cls: "opencode-stop-btn" });
    this.stopBtn.setText(this.plugin.t("Stop"));
    this.stopBtn.addClass("hidden");
    this.stopBtn.addEventListener("click", () => {
      var _a;
      this.stoppedByUser = true;
      (_a = this.currentProc) == null ? void 0 : _a.abort();
    });
  }
  updateModelBtn() {
    if (!this.modelBtn) return;
    const m = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    this.modelBtn.setText(m.length > 30 ? m.slice(0, 27) + "\u2B26" : m);
  }
  openModelList() {
    const cur = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    const open = (models) => {
      this.suggestTrigger = null;
      this.suggestItems = models.map((m) => ({
        label: m === cur ? `${m}  \u2713` : m,
        desc: m === cur ? this.plugin.t("active model") : void 0,
        action: () => {
          this.plugin.settings.model = m;
          void this.plugin.saveSettings();
          this.updateModelBtn();
          this.closeSuggest();
          this.inputEl.focus();
          this.contextLimit = 0;
          void this.refreshContext();
          new import_obsidian3.Notice(`${this.plugin.t("Model set:")} ${m}`);
        }
      }));
      this.suggestIndex = Math.max(0, this.suggestItems.findIndex((x) => x.label.startsWith(cur)));
      this.suggestOpen = true;
      this.renderSuggest();
      this.inputEl.focus();
    };
    this.plugin.runner.listModels().then(open).catch((e) => new import_obsidian3.Notice(`${this.plugin.t("Error:")} ${e.message}`));
  }
  startNewSession() {
    this.viewSession = "";
    this.plugin.settings.sessionId = "";
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    this.loadHistoryForSession("");
    new import_obsidian3.Notice(this.plugin.t("New session: the next message will start from scratch."));
  }
  continueInNewSession() {
    if (this.running) {
      new import_obsidian3.Notice(this.plugin.t("There is already a request in progress."));
      return;
    }
    const oldSession = this.viewSession;
    if (!oldSession) {
      new import_obsidian3.Notice(this.plugin.t("Select first the session to summarize."));
      return;
    }
    const bubble = this.addAssistantMessage();
    bubble.status.setText(this.plugin.t("Generating session summary..."));
    this.running = true;
    this.hadStreamError = false;
    this.stoppedByUser = false;
    this.lastStderr = "";
    this.setRunningUI(true);
    const summaryPrompt = this.plugin.t("Summarize in detail this conversation: goals, decisions made, work done, current state and next steps. Write the summary so the work can continue in a new session without losing context.");
    const proc = this.plugin.runner.runStream(summaryPrompt, [], {
      onSession: () => {
      },
      onRaw: (chunk) => {
        this.lastStderr += chunk;
      },
      onText: (text) => {
        bubble.setText(text);
        if (bubble.status.getText() !== "") bubble.status.setText("");
      },
      onReasoning: (text) => bubble.setReasoning(text),
      onStep: (step) => {
        bubble.addStep(step);
        bubble.status.setText("");
      },
      onFinish: (info) => {
        this.addStats(info);
        bubble.setFinish(info);
      },
      onError: (msg) => {
        this.hadStreamError = true;
        bubble.finalize();
        this.addErrorBubble(this.friendlyError(msg));
      },
      onDone: (code) => {
        if (this.currentProc === proc) this.currentProc = null;
        bubble.finalize();
        this.running = false;
        this.setRunningUI(false);
        const failed = code !== 0 || this.hadStreamError;
        if (failed && !this.stoppedByUser) {
          if (!this.hadStreamError) {
            const detail = this.lastStderr.trim().replace(/\s+/g, " ").slice(0, 300);
            this.addErrorBubble(
              `Riassunto non riuscito (codice ${code}).${detail ? ` ${detail}` : ""}`
            );
          }
          this.finishContinuation(
            this.buildLocalContinuation(oldSession),
            this.plugin.t("Session at the limit: new session created with the recent history.")
          );
          return;
        }
        const summary = bubble.getSnapshot().text.trim();
        const prompt = summary ? this.plugin.t("[SUMMARY OF THE PREVIOUS SESSION]") + "\n" + summary + "\n\n---\n\n" + this.plugin.t("Continue the work from here.") : this.plugin.t("Continue the work from the previous session.");
        this.finishContinuation(
          prompt,
          this.plugin.t("New session created with the summary of the previous one.")
        );
      }
    });
    this.currentProc = proc;
  }
  finishContinuation(prompt, notice) {
    this.viewSession = "";
    this.plugin.settings.sessionId = "";
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    this.loadHistoryForSession("");
    this.inputEl.value = prompt;
    this.inputEl.focus();
    new import_obsidian3.Notice(notice);
  }
  buildLocalContinuation(sessionId) {
    const history = this.plugin.getHistory(sessionId);
    const recent = history.slice(-24);
    if (recent.length === 0) {
      return this.plugin.t("The previous session has no saved history. Continue the work from here.");
    }
    const lines = [];
    for (const rec of recent) {
      const who = rec.role === "user" ? this.plugin.t("User") : "Opencode";
      const text = rec.text.length > 800 ? rec.text.slice(0, 800) + "\u2B26" : rec.text;
      lines.push(`${who}: ${text}`);
    }
    return this.plugin.t("[RECENT HISTORY OF THE PREVIOUS SESSION]") + "\n" + lines.join(
      "\n\n"
    ) + "\n\n---\n\n" + this.plugin.t("Continue the work from here, keeping the context above in mind.");
  }
  // ===== Commands / @ ! =====
  onInputKeydown(e) {
    if (this.suggestOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.suggestIndex = Math.min(this.suggestIndex + 1, this.suggestItems.length - 1);
        this.renderSuggest();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.suggestIndex = Math.max(this.suggestIndex - 1, 0);
        this.renderSuggest();
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        this.chooseSuggest(this.suggestIndex);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        this.closeSuggest();
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }
  onInputChange() {
    if (this.suggestOpen && !this.suggestTrigger) {
      this.closeSuggest();
    }
    const tr = this.detectTrigger();
    if (!tr) {
      this.closeSuggest();
      return;
    }
    const items = this.buildSuggestItems(tr.char, tr.query);
    if (items.length === 0) {
      this.closeSuggest();
      return;
    }
    this.suggestTrigger = { char: tr.char, start: tr.start };
    this.suggestItems = items;
    this.suggestIndex = 0;
    this.suggestOpen = true;
    this.renderSuggest();
  }
  detectTrigger() {
    var _a;
    const v = this.inputEl.value;
    const pos = (_a = this.inputEl.selectionStart) != null ? _a : v.length;
    let i = pos - 1;
    while (i >= 0 && !/\s/.test(v[i])) i--;
    const start = i + 1;
    const token = v.slice(start, pos);
    if (!token) return null;
    const ch = token[0];
    if (ch !== "/" && ch !== "@" && ch !== "!") return null;
    return { char: ch, start, query: token.slice(1).toLowerCase() };
  }
  buildSuggestItems(char, query) {
    const q = query.toLowerCase();
    if (char === "/") {
      if (q.startsWith("prompt")) return this.promptItems(query.slice(6));
      return this.filterItems(this.commandItems(), q);
    }
    if (char === "@") return this.filterItems(this.fileItems(), q);
    return this.filterItems(this.actionItems(), q);
  }
  filterItems(items, q) {
    if (!q) return items;
    return items.filter(
      (x) => {
        var _a;
        return x.label.toLowerCase().includes(q) || ((_a = x.desc) != null ? _a : "").toLowerCase().includes(q);
      }
    );
  }
  // /prompt: pick a saved prompt template; its text is inserted into the composer.
  promptItems(sub) {
    var _a;
    const prompts = (_a = this.plugin.settings.prompts) != null ? _a : [];
    if (prompts.length === 0) {
      return [
        {
          label: "/prompt",
          desc: this.plugin.t("No saved prompts \u2014 add them in Settings"),
          action: () => this.removeTrigger()
        }
      ];
    }
    const q = sub.trim().toLowerCase();
    const list = q ? prompts.filter((p) => p.name.toLowerCase().includes(q)) : prompts;
    return list.map((p) => ({
      label: p.name,
      desc: p.text.length > 80 ? p.text.slice(0, 77) + "\u2026" : p.text,
      action: () => this.insertPromptText(p.text)
    }));
  }
  insertPromptText(text) {
    var _a;
    const tr = this.suggestTrigger;
    if (tr) {
      const v = this.inputEl.value;
      const end = (_a = this.inputEl.selectionStart) != null ? _a : v.length;
      this.inputEl.value = v.slice(0, tr.start) + text + v.slice(end);
      const pos = tr.start + text.length;
      this.inputEl.setSelectionRange(pos, pos);
    }
    this.closeSuggest();
    this.inputEl.focus();
  }
  startPromptSelection() {
    this.closeSuggest();
    this.inputEl.value = "/prompt";
    this.inputEl.setSelectionRange(this.inputEl.value.length, this.inputEl.value.length);
    this.inputEl.focus();
    this.onInputChange();
  }
  commandItems() {
    return [
      {
        label: this.plugin.t("/model"),
        desc: this.plugin.t("Change the model"),
        action: () => {
          this.removeTrigger();
          this.openModelList();
        }
      },
      {
        label: this.plugin.t("/new"),
        desc: this.plugin.t("New session"),
        action: () => {
          this.removeTrigger();
          this.startNewSession();
        }
      },
      {
        label: this.plugin.t("/note"),
        desc: this.plugin.t("Attach the current note"),
        action: () => {
          this.removeTrigger();
          void this.attachCurrentNote();
        }
      },
      {
        label: this.plugin.t("/attach"),
        desc: this.plugin.t("Attach a file"),
        action: () => {
          this.removeTrigger();
          this.openFilePicker();
        }
      },
      {
        label: "/stats",
        desc: this.plugin.t("Token and cost statistics"),
        action: () => {
          this.removeTrigger();
          new StatsModal(this.app, this.plugin).open();
        }
      },
      {
        label: "/pin",
        desc: this.plugin.t("Pin/Unpin session"),
        action: () => {
          this.removeTrigger();
          this.togglePin();
        }
      },
      {
        label: this.plugin.t("/rename"),
        desc: this.plugin.t("Rename session"),
        action: () => {
          this.removeTrigger();
          this.renameCurrentSession();
        }
      },
      {
        label: this.plugin.t("/prompt"),
        desc: this.plugin.t("Insert a saved prompt"),
        action: () => {
          this.removeTrigger();
          this.startPromptSelection();
        }
      }
    ];
  }
  fileItems() {
    if (!this.vaultPaths) {
      this.vaultPaths = this.app.vault.getFiles().map((f) => f.path).sort((a, b) => a.localeCompare(b));
    }
    return this.vaultPaths.map((p) => ({
      label: p,
      desc: this.plugin.t("Attached"),
      action: () => {
        this.removeTrigger();
        this.addAttachment(p);
      }
    }));
  }
  actionItems() {
    return [
      {
        label: this.plugin.t("current note"),
        desc: this.plugin.t("Attach the open note as context"),
        action: () => {
          this.removeTrigger();
          void this.attachCurrentNote();
        }
      },
      {
        label: this.plugin.t("attach file"),
        desc: this.plugin.t("Pick a file to attach"),
        action: () => {
          this.removeTrigger();
          this.openFilePicker();
        }
      },
      {
        label: this.plugin.t("new session"),
        desc: this.plugin.t("Start from an empty session"),
        action: () => {
          this.removeTrigger();
          this.startNewSession();
        }
      },
      {
        label: this.plugin.t("statistics"),
        desc: this.plugin.t("Tokens and costs (5h, week, month)"),
        action: () => {
          this.removeTrigger();
          new StatsModal(this.app, this.plugin).open();
        }
      },
      {
        label: this.plugin.t("pin/unpin session"),
        desc: this.plugin.t("Pin the session in the list"),
        action: () => {
          this.removeTrigger();
          this.togglePin();
        }
      }
    ];
  }
  renderSuggest() {
    this.suggestEl.empty();
    this.suggestEl.removeClass("hidden");
    this.suggestItems.forEach((item, i) => {
      const row = this.suggestEl.createDiv({
        cls: "opencode-suggest-item" + (i === this.suggestIndex ? " is-active" : "")
      });
      row.createDiv({ cls: "opencode-suggest-label", text: item.label });
      if (item.desc) row.createDiv({ cls: "opencode-suggest-desc", text: item.desc });
      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.chooseSuggest(i);
      });
      row.addEventListener("mouseenter", () => {
        this.suggestIndex = i;
        this.renderSuggest();
      });
    });
  }
  closeSuggest() {
    var _a, _b;
    this.suggestTrigger = null;
    this.suggestOpen = false;
    this.suggestItems = [];
    (_a = this.suggestEl) == null ? void 0 : _a.addClass("hidden");
    (_b = this.suggestEl) == null ? void 0 : _b.empty();
  }
  chooseSuggest(index) {
    const item = this.suggestItems[index];
    if (item) item.action();
  }
  removeTrigger() {
    var _a;
    const tr = this.suggestTrigger;
    if (!tr) return;
    const v = this.inputEl.value;
    const end = (_a = this.inputEl.selectionStart) != null ? _a : v.length;
    this.inputEl.value = v.slice(0, tr.start) + v.slice(end);
    const pos = Math.min(tr.start, this.inputEl.value.length);
    this.inputEl.setSelectionRange(pos, pos);
    this.closeSuggest();
    this.inputEl.focus();
  }
  addWelcome() {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--assistant"
    });
    const text = this.plugin.t("Hi! I am the plugin that connects your vault to opencode. Write a message below. Try the commands: / for commands, @ to attach a file, ! for quick actions.");
    this.metaWithCopy(row, "Opencode", () => text);
    row.createDiv({ text, cls: "opencode-bubble" });
  }
  async send() {
    var _a;
    const raw = this.inputEl.value.trim();
    if (!raw || this.running) return;
    let prompt = raw;
    const ctxLabel = (_a = this.context) == null ? void 0 : _a.label;
    if (this.context) {
      prompt = `[CONTEXT FROM OBSIDIAN - ${this.context.label}]
${this.context.content}

---

` + raw;
      this.context = null;
      this.updateContextBar();
    }
    this.addUserMessage(raw, ctxLabel);
    this.inputEl.value = "";
    this.pendingUser = { text: raw, contextLabel: ctxLabel };
    const currentSession = this.viewSession;
    if (currentSession) {
      void this.plugin.appendHistory(currentSession, {
        role: "user",
        text: raw,
        contextLabel: ctxLabel
      });
      this.pendingUser = null;
    }
    const filePaths = await this.prepareAttachments();
    this.doRun(prompt, filePaths);
  }
  // Convert document attachments (PDF, Word, Excel, ...) to Markdown via anydoc
  // before sending, so any model can read them regardless of image/format support.
  async prepareAttachments() {
    const paths = [];
    const useAnydoc = this.plugin.settings.anydocEnabled;
    for (const a of this.attachments) {
      const abs = this.toAbsolutePath(a.path);
      if (useAnydoc && this.isDocument(a.path)) {
        try {
          paths.push(await this.plugin.runner.convertDocument(abs));
        } catch (e) {
          new import_obsidian3.Notice(`${this.plugin.t("anydoc conversion failed")}: ${e.message}`);
          const maxMB = this.plugin.settings.maxAttachMB || 20;
          const size = await this.fileSize(a.path);
          if (size !== null && size > maxMB * 1024 * 1024) {
            new import_obsidian3.Notice(
              substitute(
                this.plugin.t("Attachment skipped: the file is larger than $1 MB and could not be converted, so it was not attached."),
                maxMB
              )
            );
          } else {
            paths.push(abs);
          }
        }
      } else {
        paths.push(abs);
      }
    }
    return paths;
  }
  isDocument(p) {
    return /\.(pdf|docx?|pptx?|xlsx?|odt|ods|odp|rtf|epub|csv)$/i.test(p);
  }
  async fileSize(vaultPath) {
    try {
      const file = this.app.vault.getAbstractFileByPath(vaultPath);
      return file instanceof import_obsidian3.TFile ? file.stat.size : null;
    } catch (e) {
      return null;
    }
  }
  toAbsolutePath(vaultPath) {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof import_obsidian3.FileSystemAdapter) {
      const sep = process.platform === "win32" ? "\\" : "/";
      return `${adapter.getBasePath()}${sep}${vaultPath.split("/").join(sep)}`;
    }
    return vaultPath;
  }
  friendlyError(msg) {
    if (/does not support image input|image input is not supported|images? are not supported/i.test(
      msg
    )) {
      return this.plugin.t("The selected model does not support images. Remove the attached image or choose a multimodal (vision) model from the Model menu.");
    }
    return msg;
  }
  doRun(prompt, filePaths = []) {
    const bubble = this.addAssistantMessage();
    bubble.status.setText(this.plugin.t("Starting..."));
    this.running = true;
    this.hadStreamError = false;
    this.stoppedByUser = false;
    this.lastStderr = "";
    this.setRunningUI(true);
    let eventCount = 0;
    let lastEventAt = Date.now();
    this.contextRunInput = 0;
    void this.refreshContext();
    const touch = () => {
      eventCount++;
      lastEventAt = Date.now();
    };
    const updateActivity = () => {
      const since = Date.now() - lastEventAt;
      const secs = Math.round(since / 1e3);
      if (since < 4e3) {
        bubble.status.setText(`\u2026 ${eventCount} ${this.plugin.t("events")}`);
      } else if (since < 3e4) {
        bubble.status.setText(
          `\u2026 ${eventCount} ${this.plugin.t("events")} \xB7 ${substitute(this.plugin.t("last update $1s ago"), secs)}`
        );
      } else {
        bubble.status.setText(
          `\u26A0 ${this.plugin.t("Possibly stuck")} \xB7 ${substitute(this.plugin.t("last update $1s ago"), secs)}`
        );
      }
    };
    this.activityTimer = window.setInterval(updateActivity, 1500);
    const proc = this.plugin.runner.runStream(prompt, filePaths, {
      onSession: (sid) => {
        if (sid && sid !== this.viewSession) {
          this.viewSession = sid;
          this.plugin.settings.sessionId = sid;
          void this.plugin.saveSettings();
          void this.refreshContext();
          if (this.pendingUser) {
            void this.plugin.appendHistory(sid, {
              role: "user",
              text: this.pendingUser.text,
              contextLabel: this.pendingUser.contextLabel
            });
            this.pendingUser = null;
          }
        }
      },
      onRaw: (chunk) => {
        this.lastStderr += chunk;
      },
      onText: (text) => {
        if (/does not support image input|image input is not supported/i.test(text)) {
          this.hadStreamError = true;
          bubble.finalize();
          this.addErrorBubble(this.friendlyError(text));
          return;
        }
        bubble.setText(text);
        touch();
      },
      onReasoning: (text) => {
        bubble.setReasoning(text);
        touch();
      },
      onStep: (step) => {
        bubble.addStep(step);
        touch();
      },
      onFinish: (info) => {
        var _a;
        this.addStats(info);
        bubble.setFinish(info);
        if ((_a = info.tokens) == null ? void 0 : _a.input) {
          this.contextRunInput += info.tokens.input;
          this.contextUsed = this.contextBaseInput + this.contextRunInput;
          this.updateContextUsage();
        }
        touch();
      },
      onError: (msg) => {
        this.hadStreamError = true;
        bubble.finalize();
        if (/session not found/i.test(msg) && this.viewSession) {
          this.viewSession = "";
          this.plugin.settings.sessionId = "";
          void this.plugin.saveSettings();
          this.addErrorBubble(
            this.plugin.t("The saved session no longer exists: a new one will be created, resend the message.")
          );
        } else {
          this.addErrorBubble(this.friendlyError(msg));
        }
      },
      onDone: (code) => {
        if (this.activityTimer !== null) {
          clearInterval(this.activityTimer);
          this.activityTimer = null;
        }
        if (this.currentProc === proc) this.currentProc = null;
        bubble.finalize();
        const snap = bubble.getSnapshot();
        const sid = this.viewSession;
        if (sid && (snap.text.trim() || snap.reasoning.trim())) {
          void this.plugin.appendHistory(sid, {
            role: "assistant",
            text: snap.text,
            reasoning: snap.reasoning || void 0,
            tokens: snap.tokens,
            cost: snap.cost
          });
        }
        this.pendingUser = null;
        if (code !== 0 && !this.hadStreamError && !this.stoppedByUser) {
          if (/session not found/i.test(this.lastStderr) && this.viewSession) {
            this.viewSession = "";
            this.plugin.settings.sessionId = "";
            void this.plugin.saveSettings();
            this.addErrorBubble(
              this.plugin.t("The saved session no longer exists: a new one will be created, resend the message.")
            );
          } else {
            const detail = this.lastStderr.trim().replace(/\s+/g, " ").slice(0, 300);
            this.addErrorBubble(
              this.friendlyError(
                this.plugin.t("The opencode process exited with code " + String(code) + ". Check the binary path and the model in the settings.") + `.${detail ? " " + detail : ""}`
              )
            );
          }
        }
        this.running = false;
        this.setRunningUI(false);
        void this.populateSessionSelect();
        void this.refreshContext();
      }
    });
    this.currentProc = proc;
  }
  addUserMessage(text, ctxLabel) {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--user"
    });
    this.metaWithCopy(row, this.plugin.t("You"), () => text);
    if (ctxLabel) {
      row.createDiv({ cls: "opencode-context-hint", text: `${this.plugin.t("with context:")} ${ctxLabel}` });
    }
    row.createDiv({ cls: "opencode-bubble", text });
    this.scrollToBottom();
  }
  addAssistantMessage() {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--assistant"
    });
    const bubble = new AssistantBubble(row, this.app, this);
    this.scrollToBottom();
    return bubble;
  }
  addErrorBubble(msg) {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--error"
    });
    this.metaWithCopy(row, this.plugin.t("Error"), () => msg);
    row.createDiv({ cls: "opencode-bubble", text: msg });
    this.scrollToBottom();
  }
  metaWithCopy(row, label, getText) {
    const meta = row.createDiv({ cls: "opencode-meta" });
    meta.createSpan({ text: label });
    meta.createSpan({ cls: "opencode-meta-spacer" });
    const btn = meta.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: this.plugin.t("Copy text") }
    });
    (0, import_obsidian3.setIcon)(btn, "copy");
    btn.addEventListener("click", () => this.copyText(getText()));
  }
  async copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    new import_obsidian3.Notice(this.plugin.t("Text copied."));
  }
  // Format the token/cost statistics line according to the selected language.
  fmtTokens(total, input, output, cost) {
    const locale = this.plugin.settings.language === "it" ? "it-IT" : "en-US";
    return `${this.plugin.t("Token:")} ${total.toLocaleString(locale)} (${this.plugin.t("in")} ${input.toLocaleString(locale)} \xB7 ${this.plugin.t("out")} ${output.toLocaleString(locale)}) \xB7 ${this.plugin.t("Cost:")} ${cost.toFixed(4)} $`;
  }
  setRunningUI(running) {
    this.sendBtn.disabled = running;
    this.sendBtn.setText(running ? "..." : this.plugin.t("Send"));
    this.stopBtn.toggleClass("hidden", !running);
    this.sessionSelect.disabled = running;
    this.updateSessionBtnStates();
    if (running) {
      this.pinBtn.disabled = true;
      this.renameBtn.disabled = true;
      this.deleteBtn.disabled = true;
    }
  }
  loadHistoryForSession(sessionId) {
    this.messagesEl.empty();
    this.resetStats();
    this.contextRunInput = 0;
    this.contextUsed = 0;
    this.contextLimit = 0;
    this.updateContextUsage();
    void this.refreshContext();
    const history = this.plugin.getHistory(sessionId);
    if (history.length === 0) {
      this.addWelcome();
    } else {
      for (const rec of history) {
        if (rec.role === "user") {
          this.addUserMessage(rec.text, rec.contextLabel);
        } else {
          this.renderHistoryAssistant(rec);
        }
      }
    }
    this.scrollToBottom();
  }
  renderHistoryAssistant(rec) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--assistant"
    });
    this.metaWithCopy(row, this.plugin.t("Opencode"), () => rec.text);
    if (rec.reasoning && rec.reasoning.trim()) {
      const det = row.createEl("details", { cls: "opencode-reasoning" });
      det.createEl("summary").setText(this.plugin.t("Reasoning"));
      det.createDiv({ cls: "opencode-reasoning-content", text: rec.reasoning });
    }
    const content = row.createDiv({ cls: "opencode-bubble opencode-bubble--assistant" });
    if (rec.text.trim()) {
      import_obsidian3.MarkdownRenderer.render(this.app, rec.text, content, "", this).then(
        () => this.scrollToBottom()
      );
    }
    if (rec.tokens || rec.cost !== void 0) {
      const total = (_d = (_a = rec.tokens) == null ? void 0 : _a.total) != null ? _d : rec.tokens ? ((_b = rec.tokens.input) != null ? _b : 0) + ((_c = rec.tokens.output) != null ? _c : 0) : 0;
      const inp = (_f = (_e = rec.tokens) == null ? void 0 : _e.input) != null ? _f : 0;
      const out = (_h = (_g = rec.tokens) == null ? void 0 : _g.output) != null ? _h : 0;
      const cost = (_i = rec.cost) != null ? _i : 0;
      row.createDiv({
        cls: "opencode-msg-stats",
        text: this.fmtTokens(total, inp, out, cost)
      });
    }
  }
  scrollToBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  scheduleScroll() {
    if (this.renderTimer !== null) clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => this.scrollToBottom(), 150);
  }
};
var AssistantBubble = class {
  constructor(row, app, view) {
    this.row = row;
    this.app = app;
    this.view = view;
    __publicField(this, "reasoningEl");
    __publicField(this, "reasoningContent");
    __publicField(this, "stepsEl");
    __publicField(this, "steps", /* @__PURE__ */ new Map());
    __publicField(this, "contentEl");
    __publicField(this, "statsEl");
    __publicField(this, "status");
    __publicField(this, "rawText", "");
    __publicField(this, "rawReasoning", "");
    __publicField(this, "lastTokens");
    __publicField(this, "lastCost");
    __publicField(this, "renderTimer", null);
    this.view.metaWithCopy(this.row, this.view.plugin.t("Opencode"), () => this.rawText);
    this.reasoningEl = this.row.createEl("details", { cls: "opencode-reasoning hidden" });
    const summary = this.reasoningEl.createEl("summary");
    summary.setText(this.view.plugin.t("Reasoning"));
    this.reasoningContent = this.reasoningEl.createDiv({ cls: "opencode-reasoning-content" });
    this.stepsEl = this.row.createDiv({ cls: "opencode-steps" });
    this.contentEl = this.row.createDiv({ cls: "opencode-bubble opencode-bubble--assistant" });
    this.statsEl = this.row.createDiv({ cls: "opencode-msg-stats hidden" });
    this.status = this.row.createDiv({ cls: "opencode-status" });
  }
  setText(text) {
    this.rawText = text;
    if (text.length <= 3e4) {
      this.scheduleRender();
    } else {
      if (this.renderTimer !== null) {
        clearTimeout(this.renderTimer);
        this.renderTimer = null;
      }
      this.contentEl.empty();
      this.contentEl.textContent = text;
    }
    this.view.scheduleScroll();
  }
  scheduleRender() {
    if (this.renderTimer !== null) clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => this.flushRender(), 120);
  }
  flushRender() {
    if (this.renderTimer !== null) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
    if (this.rawText.length > 3e4) {
      this.contentEl.empty();
      this.contentEl.textContent = this.rawText;
      return;
    }
    this.contentEl.empty();
    if (this.rawText.trim()) {
      import_obsidian3.MarkdownRenderer.render(this.app, this.rawText, this.contentEl, "", this.view);
    }
  }
  setReasoning(text) {
    this.rawReasoning = text;
    this.reasoningEl.removeClass("hidden");
    this.reasoningContent.textContent = text;
    this.view.scheduleScroll();
  }
  addStep(step) {
    const showIO = this.view.plugin.settings.showToolIO;
    const existing = this.steps.get(step.id);
    if (step.state === "running") {
      if (existing) return;
      const row = this.stepsEl.createDiv({ cls: "opencode-step opencode-step--running" });
      const icon = row.createSpan({ cls: "opencode-step-icon" });
      icon.createDiv({ cls: "opencode-step-spinner" });
      const main = row.createDiv({ cls: "opencode-step-main" });
      const title = main.createDiv({ cls: "opencode-step-title" });
      title.setText(`${step.tool}: ${this.stepTitle(step)}`);
      if (showIO) this.buildStepDetails(main, step);
      this.steps.set(step.id, { row, icon, status: "running" });
      this.view.scheduleScroll();
      return;
    }
    const rec = existing;
    if (rec) {
      rec.status = step.state;
      rec.row.removeClass("opencode-step--running");
      rec.row.addClass(step.state === "error" ? "opencode-step--error" : "opencode-step--done");
      rec.icon.empty();
      (0, import_obsidian3.setIcon)(rec.icon, step.state === "error" ? "x" : "check");
      if (showIO) {
        const details = rec.row.querySelector("details");
        if (details) {
          const pre = details.querySelector("pre");
          if (pre) pre.setText(this.serializeStep(step));
        }
      }
    } else {
      const row = this.stepsEl.createDiv({
        cls: `opencode-step ${step.state === "error" ? "opencode-step--error" : "opencode-step--done"}`
      });
      const icon = row.createSpan({ cls: "opencode-step-icon" });
      (0, import_obsidian3.setIcon)(icon, step.state === "error" ? "x" : "check");
      const main = row.createDiv({ cls: "opencode-step-main" });
      const title = main.createDiv({ cls: "opencode-step-title" });
      title.setText(`${step.tool}: ${this.stepTitle(step)}`);
      if (showIO) this.buildStepDetails(main, step);
      this.steps.set(step.id, { row, icon, status: step.state });
    }
    this.view.scheduleScroll();
  }
  buildStepDetails(main, step) {
    const det = main.createEl("details", { cls: "opencode-step-details" });
    det.createEl("summary").setText(this.view.plugin.t("Details"));
    const pre = det.createEl("pre", { cls: "opencode-step-io" });
    pre.setText(this.serializeStep(step));
  }
  serializeStep(step) {
    const parts = [];
    const fmt = (v) => {
      const s = typeof v === "string" ? v : JSON.stringify(v, null, 2);
      return s.length > 4e3 ? s.slice(0, 4e3) + "\u2026" : s;
    };
    if (step.input !== void 0 && step.input !== null) {
      parts.push(this.view.plugin.t("INPUT:") + "\n" + fmt(step.input));
    }
    if (step.output !== void 0 && step.output !== null) {
      parts.push(this.view.plugin.t("OUTPUT:") + "\n" + fmt(step.output));
    }
    return parts.join("\n\n---\n\n") || this.view.plugin.t("(no details)");
  }
  stepTitle(step) {
    const t = String(step.title || step.tool || this.view.plugin.t("Tool"));
    return t.length > 120 ? t.slice(0, 117) + "\u2026" : t;
  }
  setFinish(info) {
    var _a, _b, _c, _d;
    this.lastTokens = info.tokens;
    this.lastCost = info.cost;
    if (info.tokens) {
      const total = (_a = info.tokens.total) != null ? _a : 0;
      const input = (_b = info.tokens.input) != null ? _b : 0;
      const output = (_c = info.tokens.output) != null ? _c : 0;
      const cost = (_d = info.cost) != null ? _d : 0;
      this.statsEl.removeClass("hidden");
      this.statsEl.setText(
        this.view.fmtTokens(total, input, output, cost)
      );
    }
  }
  getSnapshot() {
    return {
      text: this.rawText,
      reasoning: this.rawReasoning,
      tokens: this.lastTokens,
      cost: this.lastCost
    };
  }
  finalize() {
    this.contentEl.empty();
    if (this.rawText.trim() && this.rawText.length <= 3e4) {
      import_obsidian3.MarkdownRenderer.render(this.app, this.rawText, this.contentEl, "", this.view);
    } else if (this.rawText.trim()) {
      this.contentEl.textContent = this.rawText;
    }
    this.status.setText("");
    for (const rec of this.steps.values()) {
      if (rec.status === "running") {
        rec.status = "done";
        rec.row.removeClass("opencode-step--running");
        rec.row.addClass("opencode-step--done");
        rec.icon.empty();
        (0, import_obsidian3.setIcon)(rec.icon, "check");
      }
    }
  }
};

// src/opencodeRunner.ts
var import_child_process = require("child_process");
var import_crypto = require("crypto");
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
var import_obsidian4 = require("obsidian");
var OpencodeRunner = class {
  constructor(plugin) {
    __publicField(this, "plugin");
    __publicField(this, "resolvedBinary", null);
    __publicField(this, "resolvedBinaryTried", false);
    __publicField(this, "contextLimitCache", /* @__PURE__ */ new Map());
    this.plugin = plugin;
  }
  // Convert a document (PDF, Word, Excel, ...) to Markdown using anydoc
  // (https://github.com/firecrawl/anydoc). Returns the path of the .md file.
  async convertDocument(absPath) {
    const hash = (0, import_crypto.createHash)("sha256").update(absPath).digest("hex").slice(0, 16);
    const dir = (0, import_path.join)((0, import_os.tmpdir)(), "opencode-vault-anydoc");
    (0, import_fs.mkdirSync)(dir, { recursive: true });
    const ext = (0, import_path.extname)(absPath) || ".pdf";
    const cleanInput = (0, import_path.join)(dir, "in-" + hash + ext);
    (0, import_fs.copyFileSync)(absPath, cleanInput);
    const outPath = (0, import_path.join)(dir, hash + ".md");
    await this.convertWithAnydoc(cleanInput, outPath);
    return outPath;
  }
  async convertWithAnydoc(inputPath, outputPath) {
    const bin = this.plugin.settings.anydocBinary || "anydoc";
    await new Promise((resolve, reject) => {
      var _a;
      const child = this.spawnCommand(bin, [inputPath, "-o", outputPath]);
      let err = "";
      (_a = child.stderr) == null ? void 0 : _a.on("data", (d) => err += d.toString());
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`anydoc exited with code ${code}: ${err.trim().slice(0, 200)}`));
      });
    });
  }
  spawnCommand(bin, args, cwd) {
    const isWin = process.platform === "win32";
    const shell = isWin && !bin.includes("\\") && !bin.includes("/");
    return (0, import_child_process.spawn)(bin, args, {
      cwd,
      shell,
      windowsHide: true,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
  }
  // Context window size (tokens) of a model, parsed from `opencode models --verbose`.
  async getModelContextLimit(model) {
    const cached = this.contextLimitCache.get(model);
    if (cached !== void 0) return cached;
    const slash = model.indexOf("/");
    const provider = slash >= 0 ? model.slice(0, slash) : model;
    const out = await this.execCli(["models", provider, "--verbose"]);
    const limit = this.parseContextLimit(out, model);
    if (limit > 0) this.contextLimitCache.set(model, limit);
    return limit;
  }
  parseContextLimit(out, model) {
    var _a;
    const lines = out.split(/\r?\n/);
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (/^[a-zA-Z0-9_.:/+-]+$/.test(line) && line.includes("/")) {
        let json = "";
        let depth = 0;
        let started = false;
        let j = i + 1;
        for (; j < lines.length; j++) {
          const l = lines[j];
          if (!started) {
            if (!l.trim()) continue;
            started = true;
          }
          json += l + "\n";
          for (const ch of l) {
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
          }
          if (depth === 0) break;
        }
        if (line === model) {
          try {
            const obj = JSON.parse(json);
            const ctx = (_a = obj == null ? void 0 : obj.limit) == null ? void 0 : _a.context;
            if (typeof ctx === "number") return ctx;
          } catch (e) {
          }
        }
        i = j;
      } else {
        i++;
      }
    }
    return 0;
  }
  // Accumulated token usage of a session, read from the opencode database.
  async getSessionTokens(sessionId) {
    var _a, _b, _c;
    const query = `SELECT COALESCE(tokens_input,0) AS ti, COALESCE(tokens_output,0) AS tout, COALESCE(tokens_reasoning,0) AS tr FROM session WHERE id='${sessionId}'`;
    const rows = await this.runDbQuery(query);
    const r = (_a = rows[0]) != null ? _a : {};
    return { input: Number((_b = r.ti) != null ? _b : 0), output: Number((_c = r.tout) != null ? _c : 0) };
  }
  // Remove oversized file attachments from the opencode database. Attached
  // documents are stored by opencode as base64 "file" parts: an unreadable
  // (e.g. scanned) PDF can easily add tens of MB per attachment and bloat the
  // DB, causing slow writes and "database is locked" errors. Only "file" parts
  // are targeted; conversation text/reasoning parts are never touched.
  async pruneOversizedParts(ignoreAge = false) {
    var _a;
    const s = this.plugin.settings;
    if (!s.dbAutoCleanup) return;
    const maxBytes = Math.max(1, s.dbCleanupMaxMB || 5) * 1024 * 1024;
    const ageDays = Math.max(0, (_a = s.dbCleanupAgeDays) != null ? _a : 7);
    const cutoff = Math.floor(Date.now() / 1e3) - ageDays * 86400;
    const q = `DELETE FROM part WHERE data LIKE '%"type":"file%' AND length(data) > ${maxBytes}` + (ignoreAge ? "" : ` AND time_created < ${cutoff}`);
    try {
      await this.runDbQuery(q);
    } catch (e) {
    }
  }
  getVersion() {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      var _a, _b;
      const [bin, args] = this.buildCommand(s, ["--version"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      (_a = child.stdout) == null ? void 0 : _a.on("data", (d) => out += d.toString());
      (_b = child.stderr) == null ? void 0 : _b.on("data", (d) => err += d.toString());
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0 && out.trim()) resolve(out.trim().split("\n")[0]);
        else reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
      });
    });
  }
  listModels() {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      var _a, _b;
      const [bin, args] = this.buildCommand(s, ["models"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      (_a = child.stdout) == null ? void 0 : _a.on("data", (d) => out += d.toString());
      (_b = child.stderr) == null ? void 0 : _b.on("data", (d) => err += d.toString());
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) {
          const models = out.split("\n").map((l) => l.trim()).filter((l) => /^[a-zA-Z0-9_.:/+-]+$/.test(l)).sort();
          resolve(models);
        } else {
          reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
        }
      });
    });
  }
  listSessions() {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      var _a, _b;
      const [bin, args] = this.buildCommand(s, ["session", "list", "--format", "json"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      (_a = child.stdout) == null ? void 0 : _a.on("data", (d) => out += d.toString());
      (_b = child.stderr) == null ? void 0 : _b.on("data", (d) => err += d.toString());
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) {
          try {
            const arr = JSON.parse(out);
            resolve(Array.isArray(arr) ? arr : []);
          } catch (e) {
            resolve([]);
          }
        } else {
          reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
        }
      });
    });
  }
  renameSession(sessionId, title) {
    const escaped = title.replace(/'/g, "''");
    const query = `UPDATE session SET title='${escaped}' WHERE id='${sessionId}'`;
    return this.runDbQuery(query).then(() => void 0);
  }
  deleteSession(sessionId) {
    return this.execCli(["session", "delete", sessionId]).then(() => void 0);
  }
  execCli(args) {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      var _a, _b;
      const [bin, spawnArgs] = this.buildCommand(s, args);
      const child = this.spawnBinary(bin, spawnArgs);
      let out = "";
      let err = "";
      (_a = child.stdout) == null ? void 0 : _a.on("data", (d) => out += d.toString());
      (_b = child.stderr) == null ? void 0 : _b.on("data", (d) => err += d.toString());
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) resolve(out);
        else reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
      });
    });
  }
  getUsageStats() {
    const now = Date.now();
    const t5h = now - 5 * 3600 * 1e3;
    const t7d = now - 7 * 24 * 3600 * 1e3;
    const t30d = now - 30 * 24 * 3600 * 1e3;
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN time_updated >= ${t5h} THEN tokens_input END),0) AS h5_input,
        COALESCE(SUM(CASE WHEN time_updated >= ${t5h} THEN tokens_output END),0) AS h5_output,
        COALESCE(SUM(CASE WHEN time_updated >= ${t5h} THEN cost END),0) AS h5_cost,
        COALESCE(SUM(CASE WHEN time_updated >= ${t7d} THEN tokens_input END),0) AS w_input,
        COALESCE(SUM(CASE WHEN time_updated >= ${t7d} THEN tokens_output END),0) AS w_output,
        COALESCE(SUM(CASE WHEN time_updated >= ${t7d} THEN cost END),0) AS w_cost,
        COALESCE(SUM(CASE WHEN time_updated >= ${t30d} THEN tokens_input END),0) AS m_input,
        COALESCE(SUM(CASE WHEN time_updated >= ${t30d} THEN tokens_output END),0) AS m_output,
        COALESCE(SUM(CASE WHEN time_updated >= ${t30d} THEN cost END),0) AS m_cost
      FROM session
    `;
    return this.runDbQuery(query).then((rows) => {
      var _a;
      const r = (_a = rows[0]) != null ? _a : {};
      const num = (v) => Number(v != null ? v : 0);
      return {
        h5: { input: num(r.h5_input), output: num(r.h5_output), cost: num(r.h5_cost) },
        week: { input: num(r.w_input), output: num(r.w_output), cost: num(r.w_cost) },
        month: { input: num(r.m_input), output: num(r.m_output), cost: num(r.m_cost) }
      };
    });
  }
  runDbQuery(query) {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      var _a, _b;
      const [bin, args] = this.buildCommand(s, ["db", query, "--format", "json"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      (_a = child.stdout) == null ? void 0 : _a.on("data", (d) => out += d.toString());
      (_b = child.stderr) == null ? void 0 : _b.on("data", (d) => err += d.toString());
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) {
          try {
            const arr = JSON.parse(out);
            resolve(Array.isArray(arr) ? arr : []);
          } catch (e) {
            resolve([]);
          }
        } else {
          reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
        }
      });
    });
  }
  runStream(prompt, fileAttachments, cb) {
    return this.cliRunStream(prompt, fileAttachments, cb);
  }
  cliRunStream(prompt, fileAttachments, cb) {
    var _a, _b, _c;
    const s = this.plugin.settings;
    const args = ["run", "--format", "json"];
    if (s.sessionId) args.push("--session", s.sessionId);
    args.push("--model", s.model || DEFAULT_SETTINGS.model);
    if (s.agent) args.push("--agent", s.agent);
    if (s.autoApprove) args.push("--auto");
    if (s.showThinking) args.push("--thinking");
    args.push(prompt);
    for (const f of fileAttachments) args.push("--file", f);
    const [bin, spawnArgs] = this.buildCommand(s, args);
    const adapter = this.plugin.app.vault.adapter;
    const cwd = adapter instanceof import_obsidian4.FileSystemAdapter ? adapter.getBasePath() : void 0;
    const child = this.spawnBinary(bin, spawnArgs, cwd);
    let buffer = "";
    (_a = child.stdout) == null ? void 0 : _a.on("data", (d) => {
      buffer += d.toString();
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          this.handleLine(line, cb);
        } catch (e) {
          console.error("opencode-vault: error handling an event:", e);
        }
      }
    });
    (_b = child.stdout) == null ? void 0 : _b.on("end", () => {
      if (buffer.trim()) this.handleLine(buffer.trim(), cb);
    });
    (_c = child.stderr) == null ? void 0 : _c.on("data", (d) => {
      if (cb.onRaw) cb.onRaw(d.toString());
    });
    child.on("error", (e) => cb.onError(e.message));
    child.on("close", (code) => {
      cb.onDone(code != null ? code : -1);
    });
    return { abort: () => this.killProc(child) };
  }
  killProc(child) {
    if (!child || child.pid === void 0) return;
    try {
      if (process.platform === "win32") {
        (0, import_child_process.spawn)("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
      } else {
        child.kill("SIGTERM");
      }
    } catch (e) {
    }
  }
  handleLine(line, cb) {
    var _a, _b, _c, _d, _e, _f;
    if (line.length > 2e7) {
      (_a = cb.onRaw) == null ? void 0 : _a.call(cb, `[omesso evento di ${line.length} byte]
`);
      return;
    }
    let ev;
    try {
      ev = JSON.parse(line);
    } catch (e) {
      (_b = cb.onRaw) == null ? void 0 : _b.call(cb, line + "\n");
      return;
    }
    const sid = typeof ev.sessionID === "string" ? ev.sessionID : void 0;
    if (sid) cb.onSession(sid);
    const type = ev.type;
    const part = ev.part;
    switch (type) {
      case "text":
        if ((part == null ? void 0 : part.type) === "text" && typeof part.text === "string") {
          cb.onText(part.text, String(part.id));
        }
        break;
      case "reasoning":
        if (typeof (part == null ? void 0 : part.text) === "string") {
          cb.onReasoning(part.text, String(part.id));
        }
        break;
      case "tool_use":
        if ((part == null ? void 0 : part.type) === "tool") {
          const state = ((_c = part.state) == null ? void 0 : _c.status) || "completed";
          cb.onStep({
            id: String(part.callID || part.id || "step-" + Date.now()),
            tool: String(part.tool),
            title: String(((_d = part.state) == null ? void 0 : _d.title) || part.tool || this.plugin.t("Tool")),
            state: String(state),
            input: (_e = part.state) == null ? void 0 : _e.input,
            output: (_f = part.state) == null ? void 0 : _f.output
          });
        }
        break;
      case "step_finish":
        cb.onFinish({
          tokens: part == null ? void 0 : part.tokens,
          cost: typeof (part == null ? void 0 : part.cost) === "number" ? part.cost : void 0
        });
        break;
      case "error":
        cb.onError(this.errorMessage(ev.error));
        break;
      default:
        break;
    }
    if (type !== "reasoning" && (part == null ? void 0 : part.type) === "reasoning" && typeof (part == null ? void 0 : part.text) === "string") {
      cb.onReasoning(part.text, String(part.id));
    }
  }
  errorMessage(err) {
    var _a;
    if (!err) return this.plugin.t("Unknown error");
    const msg = ((_a = err.data) == null ? void 0 : _a.message) || err.message || JSON.stringify(err);
    return String(msg);
  }
  buildCommand(s, args) {
    return [s.binaryPath, args];
  }
  spawnBinary(bin, args, cwd, extraEnv) {
    const isWin = process.platform === "win32";
    const resolved = isWin ? this.resolveBinary(bin) : null;
    const shell = isWin && !resolved && !(bin.includes("\\") || bin.includes("/"));
    const options = {
      cwd,
      shell,
      windowsHide: true,
      env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
      // IMPORTANTE: stdin deve essere "ignore", non "pipe". Con stdin a pipe
      // `opencode run` resta in hang senza produrre output su Windows.
      stdio: ["ignore", "pipe", "pipe"]
    };
    return (0, import_child_process.spawn)(resolved != null ? resolved : bin, args, options);
  }
  resolveBinary(bin) {
    if (!this.resolvedBinaryTried) {
      this.resolvedBinaryTried = true;
      this.resolvedBinary = this.findWindowsBinary(bin);
    }
    return this.resolvedBinary;
  }
  findWindowsBinary(bin) {
    var _a;
    if (bin.toLowerCase().endsWith(".exe")) return bin;
    const hasPath = bin.includes("\\") || bin.includes("/");
    if (hasPath) {
      const resolved = this.resolveCmdShim(bin);
      if (resolved) return resolved;
      const dir = (0, import_path.dirname)(bin);
      const exe = (0, import_path.join)(dir, (0, import_path.basename)(bin).replace(/\.(cmd|bat|ps1)$/i, "") + ".exe");
      return (0, import_fs.existsSync)(exe) ? exe : null;
    }
    const dirs = ((_a = process.env.PATH) != null ? _a : "").split(";").filter(Boolean);
    for (const dir of dirs) {
      const cmdPath = (0, import_path.join)(dir, bin + ".cmd");
      const exePath = (0, import_path.join)(dir, bin + ".exe");
      if ((0, import_fs.existsSync)(cmdPath)) {
        const resolved = this.resolveCmdShim(cmdPath);
        if (resolved) return resolved;
      }
      if ((0, import_fs.existsSync)(exePath)) return exePath;
    }
    return null;
  }
  resolveCmdShim(shimPath) {
    try {
      const content = (0, import_fs.readFileSync)(shimPath, "utf8");
      const dir = (0, import_path.dirname)(shimPath);
      const m = content.match(/"([^"]+\.exe)"/i);
      if (m) {
        const target = m[1].replace(/%dp0%/gi, dir).replace(/%base%/gi, dir);
        if ((0, import_fs.existsSync)(target)) return target;
      }
    } catch (e) {
    }
    return null;
  }
};

// src/main.ts
var OpencodePlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "settings");
    __publicField(this, "histories", {});
    __publicField(this, "runner");
  }
  async onload() {
    var _a;
    const data = (_a = await this.loadData()) != null ? _a : {};
    const { histories, ...rest } = data;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, rest);
    this.histories = histories != null ? histories : {};
    this.runner = new OpencodeRunner(this);
    void this.runner.pruneOversizedParts();
    const t = this.t.bind(this);
    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this));
    this.addRibbonIcon("bot", t("New opencode chat"), () => {
      void this.openNewChatView();
    });
    this.addCommand({
      id: "open-chat",
      name: t("Open opencode chat"),
      callback: () => this.openChatView()
    });
    this.addCommand({
      id: "new-chat",
      name: t("New opencode chat"),
      callback: () => this.openNewChatView()
    });
    this.addCommand({
      id: "continue-new-session",
      name: t("Continue in a new session (by summarizing)"),
      callback: async () => {
        const chat = await this.openChatView();
        chat.continueInNewSession();
      }
    });
    this.addCommand({
      id: "send-selection",
      name: t("Send selection to opencode"),
      editorCallback: (editor, view) => {
        const selection = editor.getSelection();
        if (!selection.trim()) {
          new import_obsidian5.Notice(t("No text selected"));
          return;
        }
        const label = view.file ? view.file.path : "selection";
        this.openChatView().then((chat) => {
          chat.setContext({ label, content: selection });
          chat.focusInput();
        });
      }
    });
    this.addCommand({
      id: "use-current-note",
      name: t("Use the current note as context"),
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new import_obsidian5.Notice(t("No active note"));
          return;
        }
        const content = await this.app.vault.cachedRead(file);
        const chat = await this.openChatView();
        chat.setContext({ label: file.path, content });
        chat.focusInput();
      }
    });
    this.addCommand({
      id: "analyze-current-note",
      name: t("Analyze the current note with opencode"),
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new import_obsidian5.Notice(t("No active note"));
          return;
        }
        const content = await this.app.vault.cachedRead(file);
        const chat = await this.openChatView();
        chat.setContext({ label: file.path, content });
        chat.sendText(
          t(
            "Analyze the content of the attached note below: provide a summary, key points, possible links with other vault notes and suggestions to develop it."
          )
        );
      }
    });
    this.addCommand({
      id: "reset-session",
      name: t("Reset the opencode session"),
      callback: async () => {
        this.settings.sessionId = "";
        await this.saveSettings();
        new import_obsidian5.Notice(t("Session reset."));
      }
    });
    this.addSettingTab(new OpencodeSettingTab(this.app, this));
  }
  // Translate a UI string according to the selected language.
  t(text) {
    var _a, _b;
    return translate((_b = (_a = this.settings) == null ? void 0 : _a.language) != null ? _b : "en", text);
  }
  async openChatView() {
    const existing = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return existing.view;
    }
    return this.openNewChatView();
  }
  async openNewChatView() {
    const { workspace } = this.app;
    let leaf;
    try {
      leaf = workspace.getLeaf("split", "vertical");
    } catch (e) {
      leaf = workspace.getLeaf(true);
    }
    await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
    await workspace.revealLeaf(leaf);
    return leaf.view;
  }
  onunload() {
  }
  getHistory(sessionId) {
    var _a;
    return (_a = this.histories[sessionId]) != null ? _a : [];
  }
  async appendHistory(sessionId, msg) {
    var _a;
    if (!sessionId) return;
    const cap = (s) => s && s.length > 5e4 ? s.slice(0, 5e4) + "\u2026" : s;
    msg.text = (_a = cap(msg.text)) != null ? _a : "";
    if (msg.role === "assistant") msg.reasoning = cap(msg.reasoning);
    if (!this.histories[sessionId]) this.histories[sessionId] = [];
    const arr = this.histories[sessionId];
    arr.push(msg);
    if (arr.length > 100) arr.splice(0, arr.length - 100);
    await this.saveData({ ...this.settings, histories: this.histories });
  }
  async deleteHistory(sessionId) {
    delete this.histories[sessionId];
    await this.saveData({ ...this.settings, histories: this.histories });
  }
  async saveSettings() {
    await this.saveData({ ...this.settings, histories: this.histories });
  }
};
