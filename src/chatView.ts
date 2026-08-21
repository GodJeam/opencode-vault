import { App, FileSystemAdapter, ItemView, MarkdownRenderer, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import type OpencodePlugin from "./main";
import type { HistoryAssistant } from "./main";
import { DEFAULT_SETTINGS } from "./settings";
import type { FinishInfo, RunHandle, StepInfo } from "./opencodeRunner";
import { ConfirmModal, FileSuggestModal, RenameModal, StatsModal } from "./modals";

export const CHAT_VIEW_TYPE = "opencode-chat-view";

export interface TurnContext {
  label: string;
  content: string;
}

interface SessionStats {
  input: number;
  output: number;
  total: number;
  cost: number;
}

interface SuggestItem {
  label: string;
  desc?: string;
  action: () => void;
}

export class ChatView extends ItemView {
  plugin: OpencodePlugin;
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private contextBar!: HTMLElement;
  private contextLabelEl!: HTMLElement;
  private contextClearBtn!: HTMLButtonElement;
  private sessionSelect!: HTMLSelectElement;
  private pinBtn!: HTMLButtonElement;
  private renameBtn!: HTMLButtonElement;
  private deleteBtn!: HTMLButtonElement;
  private modelBtn!: HTMLButtonElement;
  private sendBtn!: HTMLButtonElement;
  private stopBtn!: HTMLButtonElement;
  private statsBar!: HTMLElement;
  private attachmentsBar!: HTMLElement;
  private suggestEl!: HTMLElement;
  private attachments: { path: string; label: string; image?: boolean }[] = [];
  private viewSession: string;
  private pendingUser: { text: string; contextLabel?: string } | null = null;
  private currentProc: RunHandle | null = null;
  private running = false;
  private context: TurnContext | null = null;
  private renderTimer: number | null = null;
  private hadStreamError = false;
  private stoppedByUser = false;
  private lastStderr = "";
  private stats: SessionStats = { input: 0, output: 0, total: 0, cost: 0 };
  private suggestItems: SuggestItem[] = [];
  private suggestIndex = 0;
  private suggestOpen = false;
  private suggestTrigger: { char: string; start: number } | null = null;
  private vaultPaths: string[] | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: OpencodePlugin) {
    super(leaf);
    this.plugin = plugin;
    this.viewSession = plugin.settings.sessionId;
  }

  getViewType(): string {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Opencode chat";
  }

  getIcon(): string {
    return "bot";
  }

  async onOpen(): Promise<void> {
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

onClose(): Promise<void> {
    this.currentProc?.abort();
    this.currentProc = null;
    return super.onClose();
  }

  setContext(ctx: TurnContext): void {
    this.context = ctx;
    this.updateContextBar();
  }

  focusInput(): void {
    this.inputEl?.focus();
  }

  sendText(text: string): void {
    if (this.inputEl) this.inputEl.value = text;
    this.send();
  }

  private buildContextBar(container: HTMLElement): void {
    this.contextBar = container.createDiv({ cls: "opencode-context-bar" });

    this.contextLabelEl = this.contextBar.createSpan({ cls: "opencode-context-label" });
    this.contextClearBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn hidden",
      attr: { title: "Rimuovi il contesto allegato" },
    });
    setIcon(this.contextClearBtn, "x");
    this.contextClearBtn.addEventListener("click", () => {
      this.context = null;
      this.updateContextBar();
    });

    this.contextBar.createSpan({ cls: "opencode-context-spacer" });

    this.sessionSelect = this.contextBar.createEl("select", {
      cls: "opencode-session-select",
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
      attr: { title: "Pina/Spilla la sessione" },
    });
    setIcon(this.pinBtn, "pin");
    this.pinBtn.addEventListener("click", () => this.togglePin());

    this.renameBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: "Rinomina sessione" },
    });
    setIcon(this.renameBtn, "pencil");
    this.renameBtn.addEventListener("click", () => this.renameCurrentSession());

    this.deleteBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: "Elimina sessione" },
    });
    setIcon(this.deleteBtn, "trash");
    this.deleteBtn.addEventListener("click", () => this.deleteCurrentSession());

    const statsBtn = this.contextBar.createEl("button", {
      cls: "opencode-icon-btn",
      attr: { title: "Statistiche token e costi" },
    });
    setIcon(statsBtn, "bar-chart-3");
    statsBtn.addEventListener("click", () => new StatsModal(this.app, this.plugin.runner).open());

    const attachBtn = this.contextBar.createEl("button", { cls: "opencode-add-note-btn" });
    attachBtn.setText("＋ Allega file");
    attachBtn.addEventListener("click", () => this.openFilePicker());

    const add = this.contextBar.createEl("button", { cls: "opencode-add-note-btn" });
    add.setText("+ Nota corrente");
    add.addEventListener("click", () => this.attachCurrentNote());

    this.updateContextBar();
  }

  private buildAttachmentsBar(container: HTMLElement): void {
    this.attachmentsBar = container.createDiv({ cls: "opencode-attachments-bar hidden" });
    this.updateAttachmentsBar();
  }

  private updateAttachmentsBar(): void {
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
      setIcon(icon, a.image ? "image" : "file-text");
      chip.createSpan({ text: a.label, cls: "opencode-attachment-label" });
      const rm = chip.createEl("button", { cls: "opencode-icon-btn" });
      setIcon(rm, "x");
      rm.addEventListener("click", () => {
        this.attachments = this.attachments.filter((x) => x.path !== a.path);
        this.updateAttachmentsBar();
      });
    }
  }

  private openFilePicker(): void {
    new FileSuggestModal(this.app, (file) => this.addAttachment(file.path)).open();
  }

  private addAttachment(path: string): void {
    if (this.attachments.some((a) => a.path === path)) return;
    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(path);
    this.attachments.push({ path, label: path, image: isImage });
    this.updateAttachmentsBar();
    if (isImage) {
      new Notice(
        "Immagine allegata: verifica che il modello selezionato supporti le immagini (vision)."
      );
    }
  }

  private togglePin(): void {
    const id = this.viewSession;
    if (!id) {
      new Notice("Seleziona una sessione da pinnare.");
      return;
    }
    const pinned = this.plugin.settings.pinned ?? [];
    const idx = pinned.indexOf(id);
    if (idx >= 0) pinned.splice(idx, 1);
    else pinned.push(id);
    this.plugin.settings.pinned = pinned;
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    new Notice(idx >= 0 ? "Sessione rimossa dai pinnati." : "Sessione pinnata.");
  }

  private renameCurrentSession(): void {
    const id = this.viewSession;
    if (!id) {
      new Notice("Seleziona una sessione da rinominare.");
      return;
    }
    const current = this.sessionSelect.selectedOptions[0]?.textContent ?? id;
    new RenameModal(this.app, current, (newTitle) => {
      this.plugin.runner
        .renameSession(id, newTitle)
        .then(() => {
          void this.populateSessionSelect();
          new Notice("Sessione rinominata.");
        })
        .catch((e) => new Notice(`Errore: ${(e as Error).message}`));
    }).open();
  }

  private deleteCurrentSession(): void {
    const id = this.viewSession;
    if (!id) {
      new Notice("Seleziona una sessione da eliminare.");
      return;
    }
    const title = this.sessionSelect.selectedOptions[0]?.textContent ?? id;
    new ConfirmModal(
      this.app,
      "Elimina sessione",
      `Vuoi eliminare la sessione "${title}"? Verrà rimossa anche la cronologia salvata in Obsidian.`,
      "Elimina",
      () => {
        this.plugin.runner
          .deleteSession(id)
          .then(async () => {
            await this.plugin.deleteHistory(id);
            const pinned = this.plugin.settings.pinned ?? [];
            const pi = pinned.indexOf(id);
            if (pi >= 0) pinned.splice(pi, 1);
            this.plugin.settings.pinned = pinned;
            if (this.viewSession === id) this.viewSession = "";
            this.plugin.settings.sessionId = "";
            await this.plugin.saveSettings();
            await this.populateSessionSelect();
            this.loadHistoryForSession(this.viewSession);
            new Notice("Sessione eliminata.");
          })
          .catch((e) => new Notice(`Errore: ${(e as Error).message}`));
      }
    ).open();
  }

  private updateContextBar(): void {
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

  private async populateSessionSelect(): Promise<void> {
    const sel = this.sessionSelect;
    sel.empty();
    const newOpt = sel.createEl("option");
    newOpt.value = "";
    newOpt.textContent = "＋ Nuova sessione";
    try {
      const sessions = await this.plugin.runner.listSessions();
      sessions.sort((a, b) => (b.updated ?? 0) - (a.updated ?? 0));
      const pinnedSet = new Set(this.plugin.settings.pinned ?? []);
      const pinned = sessions.filter((s) => pinnedSet.has(s.id));
      const recent = sessions.filter((s) => !pinnedSet.has(s.id)).slice(0, 10);
      for (const s of [...pinned, ...recent]) {
        const o = sel.createEl("option");
        o.value = s.id;
        const title = s.title || s.id;
        const mark = pinnedSet.has(s.id) ? "● " : "";
        o.textContent = mark + (title.length > 40 ? title.slice(0, 37) + "⬦" : title);
        o.title = title;
      }
    } catch {
      // mantieni solo "Nuova sessione"
    }
    sel.value = this.viewSession || "";
    this.updateSessionBtnStates();
  }

  private updateSessionBtnStates(): void {
    const hasSession = !!this.viewSession;
    this.renameBtn.disabled = !hasSession;
    this.deleteBtn.disabled = !hasSession;
    this.pinBtn.disabled = !hasSession;
    const pinned = (this.plugin.settings.pinned ?? []).includes(this.viewSession);
    this.pinBtn.toggleClass("is-active", pinned);
  }

  private buildStatsBar(container: HTMLElement): void {
    this.statsBar = container.createDiv({ cls: "opencode-stats-bar" });
    this.updateStatsBar();
  }

  private updateStatsBar(): void {
    if (!this.statsBar) return;
    this.statsBar.empty();
    this.statsBar.createSpan({
      text: `Token: ${this.stats.total.toLocaleString("it-IT")} (in ${this.stats.input.toLocaleString("it-IT")} · out ${this.stats.output.toLocaleString("it-IT")}) · Costo: ${this.stats.cost.toFixed(4)} $`,
      cls: "opencode-stats-text",
    });
  }

  private addStats(info: FinishInfo): void {
    if (info.tokens) {
      this.stats.input += info.tokens.input ?? 0;
      this.stats.output += info.tokens.output ?? 0;
      this.stats.total += info.tokens.total ?? 0;
    }
    this.stats.cost += info.cost ?? 0;
    this.updateStatsBar();
  }

  private resetStats(): void {
    this.stats = { input: 0, output: 0, total: 0, cost: 0 };
    this.updateStatsBar();
  }

  private async attachCurrentNote(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("Nessuna nota attiva");
      return;
    }
    const content = await this.app.vault.cachedRead(file);
    this.context = { label: file.path, content };
    this.updateContextBar();
    new Notice("Nota aggiunta al contesto");
  }

  private buildInputArea(container: HTMLElement): void {
    const inputArea = container.createDiv({ cls: "opencode-input-area" });

    this.suggestEl = inputArea.createDiv({ cls: "opencode-suggest hidden" });

    this.inputEl = inputArea.createEl("textarea", {
      cls: "opencode-input",
      attr: {
        placeholder:
          "Scrivi un messaggio per opencode... (Invio per inviare, Shift+Invio per andare a capo)",
      },
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
      this.stoppedByUser = true;
      this.currentProc?.abort();
    });
  }

  private updateModelBtn(): void {
    if (!this.modelBtn) return;
    const m = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    this.modelBtn.setText(m.length > 30 ? m.slice(0, 27) + "⬦" : m);
  }

  private openModelList(): void {
    const cur = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    const open = (models: string[]) => {
      this.suggestTrigger = null;
      this.suggestItems = models.map((m) => ({
        label: m === cur ? `${m}  ✓` : m,
        desc: m === cur ? "modello attivo" : undefined,
        action: () => {
          this.plugin.settings.model = m;
          void this.plugin.saveSettings();
          this.updateModelBtn();
          this.closeSuggest();
          this.inputEl.focus();
          new Notice(`Modello impostato: ${m}`);
        },
      }));
      this.suggestIndex = Math.max(0, this.suggestItems.findIndex((x) => x.label.startsWith(cur)));
      this.suggestOpen = true;
      this.renderSuggest();
      this.inputEl.focus();
    };
    this.plugin.runner
      .listModels()
      .then(open)
      .catch((e) => new Notice(`Errore: ${(e as Error).message}`));
  }

  private startNewSession(): void {
    this.viewSession = "";
    this.plugin.settings.sessionId = "";
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    this.loadHistoryForSession("");
    new Notice("Nuova sessione: il prossimo messaggio partirà da zero.");
  }

  continueInNewSession(): void {
    if (this.running) {
      new Notice("C'è già una richiesta in corso.");
      return;
    }
    const oldSession = this.viewSession;
    if (!oldSession) {
      new Notice("Seleziona prima la sessione da riassumere.");
      return;
    }

    const bubble = this.addAssistantMessage();
    bubble.status.setText("Generazione riassunto della sessione...");

    this.running = true;
    this.hadStreamError = false;
    this.stoppedByUser = false;
    this.lastStderr = "";
    this.setRunningUI(true);

    const summaryPrompt =
      "Riassumi in modo dettagliato questa conversazione: obiettivi, decisioni prese, lavoro svolto, stato attuale e prossimi passi. Scrivi il riassunto in modo che si possa continuare il lavoro in una nuova sessione senza perdere il contesto.";
    const proc = this.plugin.runner.runStream(summaryPrompt, [], {
      onSession: () => {},
      onRaw: (chunk) => {
        this.lastStderr = (this.lastStderr + chunk).slice(-4000);
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
        const prompt = summary
          ? `[RIASSUNTO DELLA SESSIONE PRECEDENTE]\n${summary}\n\n---\n\nContinua il lavoro da qui.`
          : "Continua il lavoro dalla sessione precedente.";
        this.finishContinuation(
          prompt,
          "Nuova sessione creata con il riassunto della precedente."
        );
      },
    });
    this.currentProc = proc;
  }

  private finishContinuation(prompt: string, notice: string): void {
    this.viewSession = "";
    this.plugin.settings.sessionId = "";
    void this.plugin.saveSettings();
    void this.populateSessionSelect();
    this.loadHistoryForSession("");
    this.inputEl.value = prompt;
    this.inputEl.focus();
    new Notice(notice);
  }

  private buildLocalContinuation(sessionId: string): string {
    const history = this.plugin.getHistory(sessionId);
    const recent = history.slice(-24);
    if (recent.length === 0) {
      return "La sessione precedente non ha una cronologia salvata. Continua il lavoro da qui.";
    }
    const lines: string[] = [];
    for (const rec of recent) {
      const who = rec.role === "user" ? "Utente" : "Opencode";
      const text = rec.text.length > 800 ? rec.text.slice(0, 800) + "⬦" : rec.text;
      lines.push(`${who}: ${text}`);
    }
    return (
      `[CRONOLOGIA RECENTE DELLA SESSIONE PRECEDENTE]\n${lines.join(
        "\n\n"
      )}\n\n---\n\nContinua il lavoro da qui, tenendo conto del contesto sopra.`
    );
  }

  // ===== Comandi / @ ! =====

  private onInputKeydown(e: KeyboardEvent): void {
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

  private onInputChange(): void {
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

  private detectTrigger(): { char: string; start: number; query: string } | null {
    const v = this.inputEl.value;
    const pos = this.inputEl.selectionStart ?? v.length;
    let i = pos - 1;
    while (i >= 0 && !/\s/.test(v[i])) i--;
    const start = i + 1;
    const token = v.slice(start, pos);
    if (!token) return null;
    const ch = token[0];
    if (ch !== "/" && ch !== "@" && ch !== "!") return null;
    return { char: ch, start, query: token.slice(1).toLowerCase() };
  }

  private buildSuggestItems(char: string, query: string): SuggestItem[] {
    let items: SuggestItem[];
    if (char === "/") items = this.commandItems();
    else if (char === "@") items = this.fileItems();
    else items = this.actionItems();
    const q = query.toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) => x.label.toLowerCase().includes(q) || (x.desc ?? "").toLowerCase().includes(q)
    );
  }

  private commandItems(): SuggestItem[] {
    return [
      {
        label: "/modello",
        desc: "Cambia il modello",
        action: () => {
          this.removeTrigger();
          this.openModelList();
        },
      },
      {
        label: "/nuova",
        desc: "Nuova sessione",
        action: () => {
          this.removeTrigger();
          this.startNewSession();
        },
      },
      {
        label: "/nota",
        desc: "Allega la nota corrente",
        action: () => {
          this.removeTrigger();
          void this.attachCurrentNote();
        },
      },
      {
        label: "/allega",
        desc: "Allega un file",
        action: () => {
          this.removeTrigger();
          this.openFilePicker();
        },
      },
      {
        label: "/stats",
        desc: "Statistiche token e costi",
        action: () => {
          this.removeTrigger();
          new StatsModal(this.app, this.plugin.runner).open();
        },
      },
      {
        label: "/pin",
        desc: "Pina/Spilla la sessione",
        action: () => {
          this.removeTrigger();
          this.togglePin();
        },
      },
      {
        label: "/rinomina",
        desc: "Rinomina la sessione",
        action: () => {
          this.removeTrigger();
          this.renameCurrentSession();
        },
      },
    ];
  }

  private fileItems(): SuggestItem[] {
    if (!this.vaultPaths) {
      this.vaultPaths = this.app.vault
        .getFiles()
        .map((f) => f.path)
        .sort((a, b) => a.localeCompare(b));
    }
    return this.vaultPaths.map((p) => ({
      label: p,
      desc: "Allegato",
      action: () => {
        this.removeTrigger();
        this.addAttachment(p);
      },
    }));
  }

  private actionItems(): SuggestItem[] {
    return [
      {
        label: "nota corrente",
        desc: "Allega la nota aperta come contesto",
        action: () => {
          this.removeTrigger();
          void this.attachCurrentNote();
        },
      },
      {
        label: "allega file",
        desc: "Scegli un file da allegare",
        action: () => {
          this.removeTrigger();
          this.openFilePicker();
        },
      },
      {
        label: "nuova sessione",
        desc: "Parti da una sessione vuota",
        action: () => {
          this.removeTrigger();
          this.startNewSession();
        },
      },
      {
        label: "statistiche",
        desc: "Token e costi (5h, settimana, mese)",
        action: () => {
          this.removeTrigger();
          new StatsModal(this.app, this.plugin.runner).open();
        },
      },
      {
        label: "pina/spilla sessione",
        desc: "Fissa la sessione nella lista",
        action: () => {
          this.removeTrigger();
          this.togglePin();
        },
      },
    ];
  }

  private renderSuggest(): void {
    this.suggestEl.empty();
    this.suggestEl.removeClass("hidden");
    this.suggestItems.forEach((item, i) => {
      const row = this.suggestEl.createDiv({
        cls: "opencode-suggest-item" + (i === this.suggestIndex ? " is-active" : ""),
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

  private closeSuggest(): void {
    this.suggestTrigger = null;
    this.suggestOpen = false;
    this.suggestItems = [];
    this.suggestEl?.addClass("hidden");
    this.suggestEl?.empty();
  }

  private chooseSuggest(index: number): void {
    const item = this.suggestItems[index];
    if (item) item.action();
  }

  private removeTrigger(): void {
    const tr = this.suggestTrigger;
    if (!tr) return;
    const v = this.inputEl.value;
    const end = this.inputEl.selectionStart ?? v.length;
    this.inputEl.value = v.slice(0, tr.start) + v.slice(end);
    const pos = Math.min(tr.start, this.inputEl.value.length);
    this.inputEl.setSelectionRange(pos, pos);
    this.closeSuggest();
    this.inputEl.focus();
  }

  private addWelcome(): void {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--assistant",
    });
    row.createDiv({ cls: "opencode-meta", text: "Opencode" });
    row.createDiv({
      text: "Ciao! Sono il plugin che collega il tuo vault a opencode. Scrivi un messaggio qui sotto. Prova i comandi: / per i comandi, @ per allegare un file, ! per le azioni rapide.",
      cls: "opencode-bubble",
    });
  }

  private async send(): Promise<void> {
    const raw = this.inputEl.value.trim();
    if (!raw || this.running) return;

    let prompt = raw;
    const ctxLabel = this.context?.label;
    if (this.context) {
      prompt =
        `[CONTESTO DA OBSIDIAN - ${this.context.label}]\n${this.context.content}\n\n---\n\n` + raw;
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
        contextLabel: ctxLabel,
      });
      this.pendingUser = null;
    }

    const filePaths = this.attachments.map((a) => this.toAbsolutePath(a.path));
    this.doRun(prompt, filePaths);
  }

  private toAbsolutePath(vaultPath: string): string {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      // Uso i separatori nativi della piattaforma per compatibilità Windows/macOS/Linux
      const sep = process.platform === "win32" ? "\\" : "/";
      return `${adapter.getBasePath()}${sep}${vaultPath.split("/").join(sep)}`;
    }
    return vaultPath;
  }

  private friendlyError(msg: string): string {
    if (
      /does not support image input|image input is not supported|images? are not supported/i.test(
        msg
      )
    ) {
      return "Il modello selezionato non supporta le immagini. Rimuovi l'allegato immagine oppure scegli un modello multimodale (con supporto vision) dal menu Modello.";
    }
    return msg;
  }

  private doRun(prompt: string, filePaths: string[] = []): void {
    const bubble = this.addAssistantMessage();
    bubble.status.setText("In avvio...");

    this.running = true;
    this.hadStreamError = false;
    this.stoppedByUser = false;
    this.lastStderr = "";
    this.setRunningUI(true);

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
              contextLabel: this.pendingUser.contextLabel,
            });
            this.pendingUser = null;
          }
        }
      },
      onRaw: (chunk) => {
        this.lastStderr = (this.lastStderr + chunk).slice(-4000);
      },
      onText: (text) => {
        if (/does not support image input|image input is not supported/i.test(text)) {
          this.hadStreamError = true;
          bubble.finalize();
          this.addErrorBubble(this.friendlyError(text));
          return;
        }
        bubble.setText(text);
        if (bubble.status.getText() !== "") bubble.status.setText("");
      },
      onReasoning: (text) => {
        bubble.setReasoning(text);
      },
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
        if (/session not found/i.test(msg) && this.viewSession) {
          this.viewSession = "";
          this.plugin.settings.sessionId = "";
          void this.plugin.saveSettings();
          this.addErrorBubble(
            "La sessione salvata non esiste più: ne verrà creata una nuova, rispedisci il messaggio."
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
            reasoning: snap.reasoning || undefined,
            tokens: snap.tokens,
            cost: snap.cost,
          });
        }
        this.pendingUser = null;
        if (code !== 0 && !this.hadStreamError && !this.stoppedByUser) {
          if (/session not found/i.test(this.lastStderr) && this.viewSession) {
            this.viewSession = "";
            this.plugin.settings.sessionId = "";
            void this.plugin.saveSettings();
            this.addErrorBubble(
              "La sessione salvata non esiste più: ne ho creata una nuova, rispedisci il messaggio."
            );
          } else {
            const detail = this.lastStderr.trim().replace(/\s+/g, " ").slice(0, 300);
            this.addErrorBubble(
              this.friendlyError(
                `Il processo opencode è terminato con codice ${code}.${detail ? ` ${detail}` : ""}`
              )
            );
          }
        }
        this.running = false;
        this.setRunningUI(false);
        void this.populateSessionSelect();
      },
    });
    this.currentProc = proc;
  }

  private addUserMessage(text: string, ctxLabel?: string): void {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--user",
    });
    row.createDiv({ cls: "opencode-meta", text: "Tu" });
    if (ctxLabel) {
      row.createDiv({ cls: "opencode-context-hint", text: `con contesto: ${ctxLabel}` });
    }
    row.createDiv({ cls: "opencode-bubble", text });
    this.scrollToBottom();
  }

  private addAssistantMessage(): AssistantBubble {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--assistant",
    });
    const bubble = new AssistantBubble(row, this.app, this);
    this.scrollToBottom();
    return bubble;
  }

  private addErrorBubble(msg: string): void {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--error",
    });
    row.createDiv({ cls: "opencode-meta", text: "Errore" });
    row.createDiv({ cls: "opencode-bubble", text: msg });
    this.scrollToBottom();
  }

  private setRunningUI(running: boolean): void {
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

  private loadHistoryForSession(sessionId: string): void {
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

  private renderHistoryAssistant(rec: HistoryAssistant): void {
    const row = this.messagesEl.createDiv({
      cls: "opencode-message opencode-message--assistant",
    });
    row.createDiv({ cls: "opencode-meta", text: "Opencode" });
    if (rec.reasoning && rec.reasoning.trim()) {
      const det = row.createEl("details", { cls: "opencode-reasoning" });
      det.createEl("summary").setText("Ragionamento");
      det.createDiv({ cls: "opencode-reasoning-content", text: rec.reasoning });
    }
    const content = row.createDiv({ cls: "opencode-bubble opencode-bubble--assistant" });
    if (rec.text.trim()) {
      MarkdownRenderer.render(this.app, rec.text, content, "", this).then(() =>
        this.scrollToBottom()
      );
    }
    if (rec.tokens || rec.cost !== undefined) {
      const total =
        rec.tokens?.total ??
        (rec.tokens ? (rec.tokens.input ?? 0) + (rec.tokens.output ?? 0) : 0);
      const inp = rec.tokens?.input ?? 0;
      const out = rec.tokens?.output ?? 0;
      const cost = rec.cost ?? 0;
      row.createDiv({
        cls: "opencode-msg-stats",
        text: `Token: ${total.toLocaleString("it-IT")} (in ${inp.toLocaleString("it-IT")} · out ${out.toLocaleString("it-IT")}) · Costo: ${cost.toFixed(4)} $`,
      });
    }
  }

  scrollToBottom(): void {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  scheduleScroll(): void {
    if (this.renderTimer !== null) clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => this.scrollToBottom(), 150);
  }
}

class AssistantBubble {
  private reasoningEl: HTMLDetailsElement;
  private reasoningContent: HTMLElement;
  private stepsEl: HTMLElement;
  private steps = new Map<string, { row: HTMLElement; icon: HTMLElement; status: string }>();
  private contentEl: HTMLElement;
private statsEl: HTMLElement;
  status: HTMLElement;
  private rawText = "";
  private rawReasoning = "";
  private lastTokens?: { total?: number; input?: number; output?: number };
  private lastCost?: number;

  constructor(
    private row: HTMLElement,
    private app: App,
    private view: ChatView
  ) {
    this.row.createDiv({ cls: "opencode-meta", text: "Opencode" });
    this.reasoningEl = this.row.createEl("details", { cls: "opencode-reasoning hidden" });
    const summary = this.reasoningEl.createEl("summary");
    summary.setText("Ragionamento");
    this.reasoningContent = this.reasoningEl.createDiv({ cls: "opencode-reasoning-content" });

    this.stepsEl = this.row.createDiv({ cls: "opencode-steps" });
    this.contentEl = this.row.createDiv({ cls: "opencode-bubble opencode-bubble--assistant" });
    this.statsEl = this.row.createDiv({ cls: "opencode-msg-stats hidden" });
    this.status = this.row.createDiv({ cls: "opencode-status" });
  }

setText(text: string): void {
    this.rawText = text;
    // Durante lo streaming mostriamo il testo grezzo (economico): il render
    // Markdown completo avviene una sola volta in finalize(). Re-renderizzare
    // il markdown a ogni token bloccava la UI sulle risposte lunghe.
    this.contentEl.textContent = text;
    this.view.scheduleScroll();
  }

  setReasoning(text: string): void {
    this.rawReasoning = text;
    this.reasoningEl.removeClass("hidden");
    this.reasoningContent.textContent = text;
    this.view.scheduleScroll();
  }

  addStep(step: StepInfo): void {
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
      setIcon(rec.icon, step.state === "error" ? "x" : "check");
      if (showIO) {
        const details = rec.row.querySelector("details");
        if (details) {
          const pre = details.querySelector("pre");
          if (pre) pre.setText(this.serializeStep(step));
        }
      }
    } else {
      const row = this.stepsEl.createDiv({
        cls: `opencode-step ${step.state === "error" ? "opencode-step--error" : "opencode-step--done"}`,
      });
      const icon = row.createSpan({ cls: "opencode-step-icon" });
      setIcon(icon, step.state === "error" ? "x" : "check");
      const main = row.createDiv({ cls: "opencode-step-main" });
      const title = main.createDiv({ cls: "opencode-step-title" });
      title.setText(`${step.tool}: ${this.stepTitle(step)}`);
      if (showIO) this.buildStepDetails(main, step);
      this.steps.set(step.id, { row, icon, status: step.state });
    }
    this.view.scheduleScroll();
  }

  private buildStepDetails(main: HTMLElement, step: StepInfo): void {
    const det = main.createEl("details", { cls: "opencode-step-details" });
    det.createEl("summary").setText("Dettagli");
    const pre = det.createEl("pre", { cls: "opencode-step-io" });
    pre.setText(this.serializeStep(step));
  }

private serializeStep(step: StepInfo): string {
    const parts: string[] = [];
    const fmt = (v: unknown): string => {
      const s = typeof v === "string" ? v : JSON.stringify(v, null, 2);
      return s.length > 4000 ? s.slice(0, 4000) + "…" : s;
    };
    if (step.input !== undefined && step.input !== null) {
      parts.push("INPUT:\n" + fmt(step.input));
    }
    if (step.output !== undefined && step.output !== null) {
      parts.push("OUTPUT:\n" + fmt(step.output));
    }
    return parts.join("\n\n---\n\n") || "(nessun dettaglio)";
  }

  private stepTitle(step: StepInfo): string {
    const t = String(step.title || step.tool || "Strumento");
    return t.length > 120 ? t.slice(0, 117) + "…" : t;
  }

  setFinish(info: FinishInfo): void {
    this.lastTokens = info.tokens;
    this.lastCost = info.cost;
    if (info.tokens) {
      const total = info.tokens.total ?? 0;
      const input = info.tokens.input ?? 0;
      const output = info.tokens.output ?? 0;
      const cost = info.cost ?? 0;
      this.statsEl.removeClass("hidden");
      this.statsEl.setText(
        `Token: ${total.toLocaleString("it-IT")} (in ${input.toLocaleString("it-IT")} · out ${output.toLocaleString("it-IT")}) · Costo: ${cost.toFixed(4)} $`
      );
    }
  }

  getSnapshot(): { text: string; reasoning: string; tokens?: FinishInfo["tokens"]; cost?: number } {
    return {
      text: this.rawText,
      reasoning: this.rawReasoning,
      tokens: this.lastTokens,
      cost: this.lastCost,
    };
  }

finalize(): void {
    this.contentEl.empty();
    if (this.rawText.trim()) {
      MarkdownRenderer.render(this.app, this.rawText, this.contentEl, "", this.view);
    }
    this.status.setText("");
    for (const rec of this.steps.values()) {
      if (rec.status === "running") {
        rec.status = "done";
        rec.row.removeClass("opencode-step--running");
        rec.row.addClass("opencode-step--done");
        rec.icon.empty();
        setIcon(rec.icon, "check");
      }
    }
  }
}

