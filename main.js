"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  binaryPath: "opencode",
  model: "opencode-go/deepseek-v4-flash",
  agent: "",
  autoApprove: true,
  showThinking: false,
  showToolIO: true,
  sessionId: "",
  pinned: []
};
var OpencodeSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Opencode Vault" });
    new import_obsidian.Setting(containerEl).setName("Percorso binario opencode").setDesc(
      "Comando o percorso completo dell'eseguibile. Di solito basta 'opencode' se \xE8 nel PATH. In caso di problemi usa il percorso completo (es. su Windows .../npm/opencode.cmd, su macOS/Linux .../bin/opencode)."
    ).addText(
      (text) => text.setPlaceholder("opencode").setValue(this.plugin.settings.binaryPath).onChange(async (value) => {
        this.plugin.settings.binaryPath = value.trim() || "opencode";
        await this.plugin.saveSettings();
      })
    );
    const modelSetting = new import_obsidian.Setting(containerEl).setName("Modello").setDesc(
      "Seleziona un modello dalla lista di opencode. Lo stesso selettore \xE8 disponibile anche nella barra della chat. Il default usa il provider OpenCode Go (lo stesso dell'app desktop)."
    );
    modelSetting.addDropdown((dd) => {
      this.populateModelDropdown(dd);
    });
    new import_obsidian.Setting(containerEl).setName("Aggiorna elenco modelli").setDesc("Ricarica la lista dei modelli disponibili da opencode.").addButton(
      (btn) => btn.setButtonText("Aggiorna").onClick(() => {
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Agent").setDesc("Agente opencode da usare (es. build, plan). Lascia vuoto per il default.").addText(
      (text) => text.setPlaceholder("es. build").setValue(this.plugin.settings.agent).onChange(async (value) => {
        this.plugin.settings.agent = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Session ID").setDesc(
      "ID della sessione persistente usata per la chat. Viene gestito automaticamente dal plugin: la prima volta parte una sessione nuova, poi viene riusata. Vuoto = nuova sessione al prossimo messaggio."
    ).addText(
      (text) => text.setPlaceholder("(automatico)").setValue(this.plugin.settings.sessionId).onChange(async (value) => {
        this.plugin.settings.sessionId = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Azzera sessione").setDesc("Cancella la sessione salvata e riparte da zero al prossimo messaggio.").addButton(
      (btn) => btn.setButtonText("Azzera").onClick(async () => {
        this.plugin.settings.sessionId = "";
        await this.plugin.saveSettings();
        new import_obsidian.Notice("Sessione azzerata: il prossimo messaggio partir\xE0 da una nuova sessione.");
      })
    );
    new import_obsidian.Setting(containerEl).setName("Auto-approve permessi").setDesc(
      "Concede automaticamente i permessi degli strumenti (bash, edit file, ecc.). In modalit\xE0 non interattiva opencode negherebbe tutto senza questo flag. Disattivalo per maggiore sicurezza."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoApprove).onChange(async (value) => {
        this.plugin.settings.autoApprove = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Mostra ragionamento").setDesc("Mostra i blocchi di reasoning del modello (usa il flag --thinking).").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showThinking).onChange(async (value) => {
        this.plugin.settings.showThinking = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Mostra dettagli degli strumenti").setDesc(
      "Mostra input e output di ogni strumento eseguito durante la richiesta, in blocchi apribili con un clic."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showToolIO).onChange(async (value) => {
        this.plugin.settings.showToolIO = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Testa connessione").setDesc("Esegue 'opencode --version' per verificare che il binario sia raggiungibile.").addButton(
      (btn) => btn.setButtonText("Test").onClick(async () => {
        btn.setDisabled(true);
        btn.setButtonText("Test in corso...");
        try {
          const version = await this.plugin.runner.getVersion();
          new import_obsidian.Notice(`Opencode trovato: ${version}`);
        } catch (e) {
          new import_obsidian.Notice(`Errore: ${e.message}`);
        } finally {
          btn.setDisabled(false);
          btn.setButtonText("Test");
        }
      })
    );
  }
  async populateModelDropdown(dd) {
    const cur = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    const seen = /* @__PURE__ */ new Set();
    const addOption = (value, display) => {
      if (seen.has(value)) return;
      seen.add(value);
      dd.addOption(value, display);
    };
    addOption("", "(default di opencode)");
    if (cur) addOption(cur, cur + (cur.includes("/") ? "" : " (personalizzato)"));
    dd.setValue(cur || "");
    try {
      const models = await this.plugin.runner.listModels();
      for (const m of models) addOption(m, m);
      dd.setValue(cur || "");
    } catch (e) {
      addOption("", `Errore: ${e.message}`);
    }
  }
};

// src/modals.ts
var import_obsidian2 = require("obsidian");
var RenameModal = class extends import_obsidian2.Modal {
  constructor(app, current, onSubmit) {
    super(app);
    this.current = current;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Rinomina sessione" });
    let input;
    new import_obsidian2.Setting(contentEl).setName("Nuovo titolo").addText((t) => {
      input = t.inputEl;
      t.setValue(this.current);
      t.inputEl.select();
    });
    new import_obsidian2.Setting(contentEl).addButton(
      (b) => b.setButtonText("Salva").setCta().onClick(() => {
        if (!input) return;
        const v = input.value.trim();
        if (!v) {
          new import_obsidian2.Notice("Il titolo non pu\xF2 essere vuoto.");
          return;
        }
        this.onSubmit(v);
        this.close();
      })
    ).addButton((b) => b.setButtonText("Annulla").onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var StatsModal = class extends import_obsidian2.Modal {
  constructor(app, runner) {
    super(app);
    this.runner = runner;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Utilizzo token e costi" });
    const status = contentEl.createDiv({
      cls: "opencode-stats-loading",
      text: "Caricamento..."
    });
    this.runner.getUsageStats().then((s) => {
      status.remove();
      this.renderWindow(contentEl, "Ultime 5 ore", s.h5);
      this.renderWindow(contentEl, "Ultima settimana", s.week);
      this.renderWindow(contentEl, "Ultimo mese", s.month);
    }).catch((e) => {
      status.setText(`Errore: ${e.message}`);
    });
  }
  renderWindow(container, label, w) {
    container.createEl("h4", { text: label });
    new import_obsidian2.Setting(container).setName("Token input").setDesc(w.input.toLocaleString("it-IT"));
    new import_obsidian2.Setting(container).setName("Token output").setDesc(w.output.toLocaleString("it-IT"));
    new import_obsidian2.Setting(container).setName("Totale token").setDesc((w.input + w.output).toLocaleString("it-IT"));
    new import_obsidian2.Setting(container).setName("Costo").setDesc(`${w.cost.toFixed(4)} $`);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ConfirmModal = class extends import_obsidian2.Modal {
  constructor(app, title, message, confirmLabel, onConfirm) {
    super(app);
    this.title = title;
    this.message = message;
    this.confirmLabel = confirmLabel;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.title });
    contentEl.createDiv({ cls: "opencode-confirm-message", text: this.message });
    new import_obsidian2.Setting(contentEl).addButton(
      (b) => b.setButtonText(this.confirmLabel).setWarning().onClick(() => {
        this.onConfirm();
        this.close();
      })
    ).addButton((b) => b.setButtonText("Annulla").onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var FileSuggestModal = class extends import_obsidian2.SuggestModal {
  constructor(app, onPick) {
    super(app);
    this.onPick = onPick;
    this.setPlaceholder("Cerca un file del vault da allegare...");
    this.setInstructions([
      { command: "\u2191\u2193", purpose: "navigare" },
      { command: "\u21B5", purpose: "allegare" },
      { command: "esc", purpose: "chiudere" }
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

// src/chatView.ts
var CHAT_VIEW_TYPE = "opencode-chat-view";
var ChatView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.attachments = [];
    this.pendingUser = null;
    this.currentProc = null;
    this.running = false;
    this.context = null;
    this.renderTimer = null;
    this.hadStreamError = false;
    this.stoppedByUser = false;
    this.lastStderr = "";
    this.stats = { input: 0, output: 0, total: 0, cost: 0 };
    this.suggestItems = [];
    this.suggestIndex = 0;
    this.suggestOpen = false;
    this.suggestTrigger = null;
    this.vaultPaths = null;
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
      attr: { title: "Rimuovi il contesto allegato" }
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
      attr: { title: "Pina/Spilla la sessione" }
    });
    (0, import_obsidian3.setIcon)(this.pinBtn, "pin");
    this.pinBtn.addEventListener("click", () => this.togglePin());
    this.renameBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: "Rinomina sessione" }
    });
    (0, import_obsidian3.setIcon)(this.renameBtn, "pencil");
    this.renameBtn.addEventListener("click", () => this.renameCurrentSession());
    this.deleteBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: "Elimina sessione" }
    });
    (0, import_obsidian3.setIcon)(this.deleteBtn, "trash");
    this.deleteBtn.addEventListener("click", () => this.deleteCurrentSession());
    const statsBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: "Statistiche token e costi" }
    });
    (0, import_obsidian3.setIcon)(statsBtn, "bar-chart-3");
    statsBtn.addEventListener("click", () => new StatsModal(this.app, this.plugin.runner).open());
    const attachBtn = this.contextBar.createEl("button", { cls: "opencode-add-note-btn" });
    attachBtn.setText("\uFF0B Allega file");
    attachBtn.addEventListener("click", () => this.openFilePicker());
    const add = this.contextBar.createEl("button", { cls: "opencode-add-note-btn" });
    add.setText("+ Nota corrente");
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
    new FileSuggestModal(this.app, (file) => this.addAttachment(file.path)).open();
  }
  addAttachment(path) {
    if (this.attachments.some((a) => a.path === path)) return;
    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(path);
    this.attachments.push({ path, label: path, image: isImage });
    this.updateAttachmentsBar();
    if (isImage) {
      new import_obsidian3.Notice(
        "Immagine allegata: verifica che il modello selezionato supporti le immagini (vision)."
      );
    }
  }
  togglePin() {
    var _a;
    const id = this.viewSession;
    if (!id) {
      new import_obsidian3.Notice("Seleziona una sessione da pinnare.");
      return;
    }
    const pinned = (_a = this.plugin.settings.pinned) != null ? _a : [];
    const idx = pinned.indexOf(id);
    if (idx >= 0) pinned.splice(idx, 1);
    else pinned.push(id);
    this.plugin.settings.pinned = pinned;
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    new import_obsidian3.Notice(idx >= 0 ? "Sessione rimossa dai pinnati." : "Sessione pinnata.");
  }
  renameCurrentSession() {
    var _a, _b;
    const id = this.viewSession;
    if (!id) {
      new import_obsidian3.Notice("Seleziona una sessione da rinominare.");
      return;
    }
    const current = (_b = (_a = this.sessionSelect.selectedOptions[0]) == null ? void 0 : _a.textContent) != null ? _b : id;
    new RenameModal(this.app, current, (newTitle) => {
      this.plugin.runner.renameSession(id, newTitle).then(() => {
        void this.populateSessionSelect();
        new import_obsidian3.Notice("Sessione rinominata.");
      }).catch((e) => new import_obsidian3.Notice(`Errore: ${e.message}`));
    }).open();
  }
  deleteCurrentSession() {
    var _a, _b;
    const id = this.viewSession;
    if (!id) {
      new import_obsidian3.Notice("Seleziona una sessione da eliminare.");
      return;
    }
    const title = (_b = (_a = this.sessionSelect.selectedOptions[0]) == null ? void 0 : _a.textContent) != null ? _b : id;
    new ConfirmModal(
      this.app,
      "Elimina sessione",
      `Vuoi eliminare la sessione "${title}"? Verr\xE0 rimossa anche la cronologia salvata in Obsidian.`,
      "Elimina",
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
          new import_obsidian3.Notice("Sessione eliminata.");
        }).catch((e) => new import_obsidian3.Notice(`Errore: ${e.message}`));
      }
    ).open();
  }
  updateContextBar() {
    if (this.context) {
      this.contextLabelEl.setText(`Contesto: ${this.context.label}`);
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
    newOpt.textContent = "\uFF0B Nuova sessione";
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
    this.updateStatsBar();
  }
  updateStatsBar() {
    if (!this.statsBar) return;
    this.statsBar.empty();
    this.statsBar.createSpan({
      text: `Token: ${this.stats.total.toLocaleString("it-IT")} (in ${this.stats.input.toLocaleString("it-IT")} \xB7 out ${this.stats.output.toLocaleString("it-IT")}) \xB7 Costo: ${this.stats.cost.toFixed(4)} $`,
      cls: "opencode-stats-text"
    });
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
      new import_obsidian3.Notice("Nessuna nota attiva");
      return;
    }
    const content = await this.app.vault.cachedRead(file);
    this.context = { label: file.path, content };
    this.updateContextBar();
    new import_obsidian3.Notice("Nota aggiunta al contesto");
  }
  buildInputArea(container) {
    const inputArea = container.createDiv({ cls: "opencode-input-area" });
    this.suggestEl = inputArea.createDiv({ cls: "opencode-suggest hidden" });
    this.inputEl = inputArea.createEl("textarea", {
      cls: "opencode-input",
      attr: {
        placeholder: "Scrivi un messaggio per opencode... (Invio per inviare, Shift+Invio per andare a capo)"
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
    this.sendBtn.setText("Invia");
    this.sendBtn.addEventListener("click", () => this.send());
    this.stopBtn = buttons.createEl("button", { cls: "opencode-stop-btn" });
    this.stopBtn.setText("Stop");
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
        desc: m === cur ? "modello attivo" : void 0,
        action: () => {
          this.plugin.settings.model = m;
          void this.plugin.saveSettings();
          this.updateModelBtn();
          this.closeSuggest();
          this.inputEl.focus();
          new import_obsidian3.Notice(`Modello impostato: ${m}`);
        }
      }));
      this.suggestIndex = Math.max(0, this.suggestItems.findIndex((x) => x.label.startsWith(cur)));
      this.suggestOpen = true;
      this.renderSuggest();
      this.inputEl.focus();
    };
    this.plugin.runner.listModels().then(open).catch((e) => new import_obsidian3.Notice(`Errore: ${e.message}`));
  }
  startNewSession() {
    this.viewSession = "";
    this.plugin.settings.sessionId = "";
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    this.loadHistoryForSession("");
    new import_obsidian3.Notice("Nuova sessione: il prossimo messaggio partir\xE0 da zero.");
  }
  continueInNewSession() {
    if (this.running) {
      new import_obsidian3.Notice("C'\xE8 gi\xE0 una richiesta in corso.");
      return;
    }
    const oldSession = this.viewSession;
    if (!oldSession) {
      new import_obsidian3.Notice("Seleziona prima la sessione da riassumere.");
      return;
    }
    const bubble = this.addAssistantMessage();
    bubble.status.setText("Generazione riassunto della sessione...");
    this.running = true;
    this.hadStreamError = false;
    this.stoppedByUser = false;
    this.lastStderr = "";
    this.setRunningUI(true);
    const summaryPrompt = "Riassumi in modo dettagliato questa conversazione: obiettivi, decisioni prese, lavoro svolto, stato attuale e prossimi passi. Scrivi il riassunto in modo che si possa continuare il lavoro in una nuova sessione senza perdere il contesto.";
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
            "Sessione al limite: nuova sessione creata con la cronologia recente."
          );
          return;
        }
        const summary = bubble.getSnapshot().text.trim();
        const prompt = summary ? `[RIASSUNTO DELLA SESSIONE PRECEDENTE]
${summary}

---

Continua il lavoro da qui.` : "Continua il lavoro dalla sessione precedente.";
        this.finishContinuation(
          prompt,
          "Nuova sessione creata con il riassunto della precedente."
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
      return "La sessione precedente non ha una cronologia salvata. Continua il lavoro da qui.";
    }
    const lines = [];
    for (const rec of recent) {
      const who = rec.role === "user" ? "Utente" : "Opencode";
      const text = rec.text.length > 800 ? rec.text.slice(0, 800) + "\u2B26" : rec.text;
      lines.push(`${who}: ${text}`);
    }
    return `[CRONOLOGIA RECENTE DELLA SESSIONE PRECEDENTE]
${lines.join(
      "\n\n"
    )}

---

Continua il lavoro da qui, tenendo conto del contesto sopra.`;
  }
  // ===== Comandi / @ ! =====
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
    let items;
    if (char === "/") items = this.commandItems();
    else if (char === "@") items = this.fileItems();
    else items = this.actionItems();
    const q = query.toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) => {
        var _a;
        return x.label.toLowerCase().includes(q) || ((_a = x.desc) != null ? _a : "").toLowerCase().includes(q);
      }
    );
  }
  commandItems() {
    return [
      {
        label: "/modello",
        desc: "Cambia il modello",
        action: () => {
          this.removeTrigger();
          this.openModelList();
        }
      },
      {
        label: "/nuova",
        desc: "Nuova sessione",
        action: () => {
          this.removeTrigger();
          this.startNewSession();
        }
      },
      {
        label: "/nota",
        desc: "Allega la nota corrente",
        action: () => {
          this.removeTrigger();
          void this.attachCurrentNote();
        }
      },
      {
        label: "/allega",
        desc: "Allega un file",
        action: () => {
          this.removeTrigger();
          this.openFilePicker();
        }
      },
      {
        label: "/stats",
        desc: "Statistiche token e costi",
        action: () => {
          this.removeTrigger();
          new StatsModal(this.app, this.plugin.runner).open();
        }
      },
      {
        label: "/pin",
        desc: "Pina/Spilla la sessione",
        action: () => {
          this.removeTrigger();
          this.togglePin();
        }
      },
      {
        label: "/rinomina",
        desc: "Rinomina la sessione",
        action: () => {
          this.removeTrigger();
          this.renameCurrentSession();
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
      desc: "Allegato",
      action: () => {
        this.removeTrigger();
        this.addAttachment(p);
      }
    }));
  }
  actionItems() {
    return [
      {
        label: "nota corrente",
        desc: "Allega la nota aperta come contesto",
        action: () => {
          this.removeTrigger();
          void this.attachCurrentNote();
        }
      },
      {
        label: "allega file",
        desc: "Scegli un file da allegare",
        action: () => {
          this.removeTrigger();
          this.openFilePicker();
        }
      },
      {
        label: "nuova sessione",
        desc: "Parti da una sessione vuota",
        action: () => {
          this.removeTrigger();
          this.startNewSession();
        }
      },
      {
        label: "statistiche",
        desc: "Token e costi (5h, settimana, mese)",
        action: () => {
          this.removeTrigger();
          new StatsModal(this.app, this.plugin.runner).open();
        }
      },
      {
        label: "pina/spilla sessione",
        desc: "Fissa la sessione nella lista",
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
    const text = "Ciao! Sono il plugin che collega il tuo vault a opencode. Scrivi un messaggio qui sotto. Prova i comandi: / per i comandi, @ per allegare un file, ! per le azioni rapide.";
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
      prompt = `[CONTESTO DA OBSIDIAN - ${this.context.label}]
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
    const filePaths = this.attachments.map((a) => this.toAbsolutePath(a.path));
    this.doRun(prompt, filePaths);
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
      return "Il modello selezionato non supporta le immagini. Rimuovi l'allegato immagine oppure scegli un modello multimodale (con supporto vision) dal menu Modello.";
    }
    return msg;
  }
  doRun(prompt, filePaths = []) {
    const bubble = this.addAssistantMessage();
    bubble.status.setText("In avvio...");
    this.running = true;
    this.hadStreamError = false;
    this.stoppedByUser = false;
    this.lastStderr = "";
    this.setRunningUI(true);
    let eventCount = 0;
    let lastStatusUpdate = 0;
    const touch = () => {
      eventCount++;
      const now = Date.now();
      if (now - lastStatusUpdate > 400) {
        lastStatusUpdate = now;
        bubble.status.setText(`\u2026 ${eventCount} eventi`);
      }
    };
    const proc = this.plugin.runner.runStream(prompt, filePaths, {
      onSession: (sid) => {
        if (sid && sid !== this.viewSession) {
          this.viewSession = sid;
          this.plugin.settings.sessionId = sid;
          void this.plugin.saveSettings();
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
        this.addStats(info);
        bubble.setFinish(info);
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
            "La sessione salvata non esiste pi\xF9: ne verr\xE0 creata una nuova, rispedisci il messaggio."
          );
        } else {
          this.addErrorBubble(this.friendlyError(msg));
        }
      },
      onDone: (code) => {
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
              "La sessione salvata non esiste pi\xF9: ne ho creata una nuova, rispedisci il messaggio."
            );
          } else {
            const detail = this.lastStderr.trim().replace(/\s+/g, " ").slice(0, 300);
            this.addErrorBubble(
              this.friendlyError(
                `Il processo opencode \xE8 terminato con codice ${code}.${detail ? ` ${detail}` : ""}`
              )
            );
          }
        }
        this.running = false;
        this.setRunningUI(false);
        void this.populateSessionSelect();
      }
    });
    this.currentProc = proc;
  }
  addUserMessage(text, ctxLabel) {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--user"
    });
    this.metaWithCopy(row, "Tu", () => text);
    if (ctxLabel) {
      row.createDiv({ cls: "opencode-context-hint", text: `con contesto: ${ctxLabel}` });
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
    this.metaWithCopy(row, "Errore", () => msg);
    row.createDiv({ cls: "opencode-bubble", text: msg });
    this.scrollToBottom();
  }
  metaWithCopy(row, label, getText) {
    const meta = row.createDiv({ cls: "opencode-meta" });
    meta.createSpan({ text: label });
    meta.createSpan({ cls: "opencode-meta-spacer" });
    const btn = meta.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: "Copia testo" }
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
    new import_obsidian3.Notice("Testo copiato.");
  }
  setRunningUI(running) {
    this.sendBtn.disabled = running;
    this.sendBtn.setText(running ? "..." : "Invia");
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
    this.metaWithCopy(row, "Opencode", () => rec.text);
    if (rec.reasoning && rec.reasoning.trim()) {
      const det = row.createEl("details", { cls: "opencode-reasoning" });
      det.createEl("summary").setText("Ragionamento");
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
        text: `Token: ${total.toLocaleString("it-IT")} (in ${inp.toLocaleString("it-IT")} \xB7 out ${out.toLocaleString("it-IT")}) \xB7 Costo: ${cost.toFixed(4)} $`
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
    this.steps = /* @__PURE__ */ new Map();
    this.rawText = "";
    this.rawReasoning = "";
    this.renderTimer = null;
    this.view.metaWithCopy(this.row, "Opencode", () => this.rawText);
    this.reasoningEl = this.row.createEl("details", { cls: "opencode-reasoning hidden" });
    const summary = this.reasoningEl.createEl("summary");
    summary.setText("Ragionamento");
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
    det.createEl("summary").setText("Dettagli");
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
      parts.push("INPUT:\n" + fmt(step.input));
    }
    if (step.output !== void 0 && step.output !== null) {
      parts.push("OUTPUT:\n" + fmt(step.output));
    }
    return parts.join("\n\n---\n\n") || "(nessun dettaglio)";
  }
  stepTitle(step) {
    const t = String(step.title || step.tool || "Strumento");
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
        `Token: ${total.toLocaleString("it-IT")} (in ${input.toLocaleString("it-IT")} \xB7 out ${output.toLocaleString("it-IT")}) \xB7 Costo: ${cost.toFixed(4)} $`
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
var import_fs = require("fs");
var import_path = require("path");
var import_obsidian4 = require("obsidian");
var OpencodeRunner = class {
  constructor(plugin) {
    this.resolvedBinary = null;
    this.resolvedBinaryTried = false;
    this.plugin = plugin;
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
          console.error("opencode-vault: errore gestendo un evento:", e);
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
    if (line.length > 15e5) {
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
            title: String(((_d = part.state) == null ? void 0 : _d.title) || part.tool || "Strumento"),
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
    if (!err) return "Errore sconosciuto";
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
    this.histories = {};
  }
  async onload() {
    var _a;
    const data = (_a = await this.loadData()) != null ? _a : {};
    const { histories, ...rest } = data;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, rest);
    this.histories = histories != null ? histories : {};
    this.runner = new OpencodeRunner(this);
    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this));
    this.addRibbonIcon("bot", "Nuova chat opencode", () => {
      void this.openNewChatView();
    });
    this.addCommand({
      id: "open-chat",
      name: "Apri chat opencode",
      callback: () => this.openChatView()
    });
    this.addCommand({
      id: "new-chat",
      name: "Nuova chat opencode",
      callback: () => this.openNewChatView()
    });
    this.addCommand({
      id: "continue-new-session",
      name: "Continua in una nuova sessione (riassumendo)",
      callback: async () => {
        const chat = await this.openChatView();
        chat.continueInNewSession();
      }
    });
    this.addCommand({
      id: "send-selection",
      name: "Invia selezione a opencode",
      editorCallback: (editor, view) => {
        const selection = editor.getSelection();
        if (!selection.trim()) {
          new import_obsidian5.Notice("Nessun testo selezionato");
          return;
        }
        const label = view.file ? view.file.path : "selezione";
        this.openChatView().then((chat) => {
          chat.setContext({ label, content: selection });
          chat.focusInput();
        });
      }
    });
    this.addCommand({
      id: "use-current-note",
      name: "Usa la nota corrente come contesto",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new import_obsidian5.Notice("Nessuna nota attiva");
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
      name: "Analizza la nota corrente con opencode",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new import_obsidian5.Notice("Nessuna nota attiva");
          return;
        }
        const content = await this.app.vault.cachedRead(file);
        const chat = await this.openChatView();
        chat.setContext({ label: file.path, content });
        chat.sendText(
          "Analizza il contenuto della nota allegata qui sotto: fornisci un riassunto, i punti chiave, eventuali collegamenti con altre note del vault e suggerimenti per svilupparla."
        );
      }
    });
    this.addCommand({
      id: "reset-session",
      name: "Azzera la sessione opencode",
      callback: async () => {
        this.settings.sessionId = "";
        await this.saveSettings();
        new import_obsidian5.Notice("Sessione opencode azzerata.");
      }
    });
    this.addSettingTab(new OpencodeSettingTab(this.app, this));
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
    const cap = (t) => t && t.length > 5e4 ? t.slice(0, 5e4) + "\u2026" : t;
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
