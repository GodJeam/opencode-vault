import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { CHAT_VIEW_TYPE, ChatView } from "./chatView";
import { OpencodeRunner } from "./opencodeRunner";
import { DEFAULT_SETTINGS, OpencodeSettingTab, OpencodeSettings } from "./settings";

export interface HistoryUser {
  role: "user";
  text: string;
  contextLabel?: string;
}

export interface HistoryAssistant {
  role: "assistant";
  text: string;
  reasoning?: string;
  tokens?: { total?: number; input?: number; output?: number };
  cost?: number;
}

export type HistoryMessage = HistoryUser | HistoryAssistant;
export type HistoryMap = Record<string, HistoryMessage[]>;

export default class OpencodePlugin extends Plugin {
  settings!: OpencodeSettings;
  histories: HistoryMap = {};
  runner!: OpencodeRunner;

  async onload(): Promise<void> {
    const data = (await this.loadData()) ?? {};
    const { histories, ...rest } = data as { histories?: HistoryMap } & Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, rest);
    this.histories = histories ?? {};
    this.runner = new OpencodeRunner(this);

    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this));

    this.addRibbonIcon("bot", "Nuova chat opencode", () => {
      void this.openNewChatView();
    });

    this.addCommand({
      id: "open-chat",
      name: "Apri chat opencode",
      callback: () => this.openChatView(),
    });

    this.addCommand({
      id: "new-chat",
      name: "Nuova chat opencode",
      callback: () => this.openNewChatView(),
    });

    this.addCommand({
      id: "continue-new-session",
      name: "Continua in una nuova sessione (riassumendo)",
      callback: async () => {
        const chat = await this.openChatView();
        chat.continueInNewSession();
      },
    });

    this.addCommand({
      id: "send-selection",
      name: "Invia selezione a opencode",
      editorCallback: (editor, view) => {
        const selection = editor.getSelection();
        if (!selection.trim()) {
          new Notice("Nessun testo selezionato");
          return;
        }
        const label = view.file ? view.file.path : "selezione";
        this.openChatView().then((chat) => {
          chat.setContext({ label, content: selection });
          chat.focusInput();
        });
      },
    });

    this.addCommand({
      id: "use-current-note",
      name: "Usa la nota corrente come contesto",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice("Nessuna nota attiva");
          return;
        }
        const content = await this.app.vault.cachedRead(file);
        const chat = await this.openChatView();
        chat.setContext({ label: file.path, content });
        chat.focusInput();
      },
    });

    this.addCommand({
      id: "analyze-current-note",
      name: "Analizza la nota corrente con opencode",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice("Nessuna nota attiva");
          return;
        }
        const content = await this.app.vault.cachedRead(file);
        const chat = await this.openChatView();
        chat.setContext({ label: file.path, content });
        chat.sendText(
          "Analizza il contenuto della nota allegata qui sotto: fornisci un riassunto, i punti chiave, eventuali collegamenti con altre note del vault e suggerimenti per svilupparla."
        );
      },
    });

    this.addCommand({
      id: "reset-session",
      name: "Azzera la sessione opencode",
      callback: async () => {
        this.settings.sessionId = "";
        await this.saveSettings();
        new Notice("Sessione opencode azzerata.");
      },
    });

    this.addSettingTab(new OpencodeSettingTab(this.app, this));
  }

  async openChatView(): Promise<ChatView> {
    const existing = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return existing.view as ChatView;
    }
    return this.openNewChatView();
  }

  async openNewChatView(): Promise<ChatView> {
    const { workspace } = this.app;
    // Apre una nuova chat in un pannello affiancato (split verticale),
    // così puoi gestire più sessioni contemporaneamente.
    let leaf: WorkspaceLeaf;
    try {
      leaf = workspace.getLeaf("split", "vertical");
    } catch {
      leaf = workspace.getLeaf(true);
    }
    await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
    await workspace.revealLeaf(leaf);
    return leaf.view as ChatView;
  }

  onunload(): void {
    // i processi in corso vengono terminati da ogni singola vista (onClose)
    this.runner.stopServer();
    if (this.savePending) {
      void this.saveData({ ...this.settings, histories: this.histories });
    }
  }

  getHistory(sessionId: string): HistoryMessage[] {
    return this.histories[sessionId] ?? [];
  }

  async appendHistory(sessionId: string, msg: HistoryMessage): Promise<void> {
    if (!sessionId) return;
    if (!this.histories[sessionId]) this.histories[sessionId] = [];
    const arr = this.histories[sessionId];
    arr.push(msg);
    if (arr.length > 100) arr.splice(0, arr.length - 100);
    this.scheduleHistorySave();
  }

  async deleteHistory(sessionId: string): Promise<void> {
    delete this.histories[sessionId];
    this.scheduleHistorySave();
  }

  async saveSettings(): Promise<void> {
    await this.flushHistorySave();
  }

  private saveTimer: number | null = null;
  private savePending = false;

  // La cronologia viene scritta su disco con un piccolo debounce: evita di
  // riscrivere l'intero data.json a ogni singolo messaggio.
  private scheduleHistorySave(): void {
    this.savePending = true;
    if (this.saveTimer !== null) return;
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      if (this.savePending) {
        this.savePending = false;
        void this.saveData({ ...this.settings, histories: this.histories });
      }
    }, 800);
  }

  private async flushHistorySave(): Promise<void> {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.savePending) {
      this.savePending = false;
      await this.saveData({ ...this.settings, histories: this.histories });
    }
  }
}