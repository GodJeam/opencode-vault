import { App, Modal, Notice, Setting, SuggestModal } from "obsidian";
import type { TFile } from "obsidian";
import type { OpencodeRunner, UsageWindow } from "./opencodeRunner";

export class RenameModal extends Modal {
  constructor(
    app: App,
    private current: string,
    private onSubmit: (title: string) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Rinomina sessione" });

    let input: HTMLInputElement | undefined;
    new Setting(contentEl).setName("Nuovo titolo").addText((t) => {
      input = t.inputEl;
      t.setValue(this.current);
      t.inputEl.select();
    });

    new Setting(contentEl)
      .addButton((b) =>
        b.setButtonText("Salva").setCta().onClick(() => {
          if (!input) return;
          const v = input.value.trim();
          if (!v) {
            new Notice("Il titolo non puÃ² essere vuoto.");
            return;
          }
          this.onSubmit(v);
          this.close();
        })
      )
      .addButton((b) => b.setButtonText("Annulla").onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class StatsModal extends Modal {
  constructor(app: App, private runner: OpencodeRunner) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Utilizzo token e costi" });
    const status = contentEl.createDiv({
      cls: "opencode-stats-loading",
      text: "Caricamento...",
    });

    this.runner
      .getUsageStats()
      .then((s) => {
        status.remove();
        this.renderWindow(contentEl, "Ultime 5 ore", s.h5);
        this.renderWindow(contentEl, "Ultima settimana", s.week);
        this.renderWindow(contentEl, "Ultimo mese", s.month);
      })
      .catch((e) => {
        status.setText(`Errore: ${(e as Error).message}`);
      });
  }

  private renderWindow(container: HTMLElement, label: string, w: UsageWindow): void {
    container.createEl("h4", { text: label });
    new Setting(container).setName("Token input").setDesc(w.input.toLocaleString("it-IT"));
    new Setting(container).setName("Token output").setDesc(w.output.toLocaleString("it-IT"));
    new Setting(container).setName("Totale token").setDesc((w.input + w.output).toLocaleString("it-IT"));
    new Setting(container).setName("Costo").setDesc(`${w.cost.toFixed(4)} $`);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private title: string,
    private message: string,
    private confirmLabel: string,
    private onConfirm: () => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.title });
    contentEl.createDiv({ cls: "opencode-confirm-message", text: this.message });
    new Setting(contentEl)
      .addButton((b) =>
        b
          .setButtonText(this.confirmLabel)
          .setWarning()
          .onClick(() => {
            this.onConfirm();
            this.close();
          })
      )
      .addButton((b) => b.setButtonText("Annulla").onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class FileSuggestModal extends SuggestModal<TFile> {
  constructor(app: App, private onPick: (file: TFile) => void) {
    super(app);
    this.setPlaceholder("Cerca un file del vault da allegare...");
    this.setInstructions([
      { command: "â†‘â†“", purpose: "navigare" },
      { command: "â†µ", purpose: "allegare" },
      { command: "esc", purpose: "chiudere" },
    ]);
  }

  getItems(): TFile[] {
    return this.app.vault.getFiles().sort((a, b) => a.path.localeCompare(b.path));
  }

  getSuggestions(query: string): TFile[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getItems();
    return this.getItems().filter((f) => f.path.toLowerCase().includes(q));
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.createEl("div", { text: file.path });
  }

  onChooseSuggestion(file: TFile): void {
    this.onPick(file);
  }
}


