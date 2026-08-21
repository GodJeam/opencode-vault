import { App, DropdownComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import type OpencodePlugin from "./main";

export type TikzEngine = "auto" | "pdf" | "dvi";

export interface OpencodeSettings {
  binaryPath: string;
  model: string;
  agent: string;
  autoApprove: boolean;
  showThinking: boolean;
  showToolIO: boolean;
  sessionId: string;
  pinned: string[];
  tikzEnabled: boolean;
  tikzEngine: TikzEngine;
  tikzLatexBin: string;
  tikzDvisvgmBin: string;
  tikzExtraPreamble: string;
  tikzLivePreview: boolean;
}

export const DEFAULT_SETTINGS: OpencodeSettings = {
  binaryPath: "opencode",
  model: "opencode-go/deepseek-v4-flash",
  agent: "",
  autoApprove: true,
  showThinking: false,
  showToolIO: true,
  sessionId: "",
  pinned: [],
  tikzEnabled: true,
  tikzEngine: "auto",
  tikzLatexBin: "",
  tikzDvisvgmBin: "",
  tikzExtraPreamble: "",
  tikzLivePreview: true,
};

export class OpencodeSettingTab extends PluginSettingTab {
  plugin: OpencodePlugin;

  constructor(app: App, plugin: OpencodePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Opencode Vault" });

    new Setting(containerEl)
      .setName("Percorso binario opencode")
      .setDesc(
        "Comando o percorso completo dell'eseguibile. Di solito basta 'opencode' se è nel PATH. In caso di problemi usa il percorso completo (es. su Windows .../npm/opencode.cmd, su macOS/Linux .../bin/opencode)."
      )
      .addText((text) =>
        text
          .setPlaceholder("opencode")
          .setValue(this.plugin.settings.binaryPath)
          .onChange(async (value) => {
            this.plugin.settings.binaryPath = value.trim() || "opencode";
            await this.plugin.saveSettings();
          })
      );

    const modelSetting = new Setting(containerEl)
      .setName("Modello")
      .setDesc(
        "Seleziona un modello dalla lista di opencode. Lo stesso selettore è disponibile anche nella barra della chat. Il default usa il provider OpenCode Go (lo stesso dell'app desktop)."
      );

    modelSetting.addDropdown((dd) => {
      this.populateModelDropdown(dd);
    });

    new Setting(containerEl)
      .setName("Aggiorna elenco modelli")
      .setDesc("Ricarica la lista dei modelli disponibili da opencode.")
      .addButton((btn) =>
        btn.setButtonText("Aggiorna").onClick(() => {
          this.display();
        })
      );

    new Setting(containerEl)
      .setName("Agent")
      .setDesc("Agente opencode da usare (es. build, plan). Lascia vuoto per il default.")
      .addText((text) =>
        text
          .setPlaceholder("es. build")
          .setValue(this.plugin.settings.agent)
          .onChange(async (value) => {
            this.plugin.settings.agent = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Session ID")
      .setDesc(
        "ID della sessione persistente usata per la chat. Viene gestito automaticamente dal plugin: la prima volta parte una sessione nuova, poi viene riusata. Vuoto = nuova sessione al prossimo messaggio."
      )
      .addText((text) =>
        text
          .setPlaceholder("(automatico)")
          .setValue(this.plugin.settings.sessionId)
          .onChange(async (value) => {
            this.plugin.settings.sessionId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Azzera sessione")
      .setDesc("Cancella la sessione salvata e riparte da zero al prossimo messaggio.")
      .addButton((btn) =>
        btn.setButtonText("Azzera").onClick(async () => {
          this.plugin.settings.sessionId = "";
          await this.plugin.saveSettings();
          new Notice("Sessione azzerata: il prossimo messaggio partirà da una nuova sessione.");
        })
      );

    new Setting(containerEl)
      .setName("Auto-approve permessi")
      .setDesc(
        "Concede automaticamente i permessi degli strumenti (bash, edit file, ecc.). In modalità non interattiva opencode negherebbe tutto senza questo flag. Disattivalo per maggiore sicurezza."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoApprove)
          .onChange(async (value) => {
            this.plugin.settings.autoApprove = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Mostra ragionamento")
      .setDesc("Mostra i blocchi di reasoning del modello (usa il flag --thinking).")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showThinking)
          .onChange(async (value) => {
            this.plugin.settings.showThinking = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Mostra dettagli degli strumenti")
      .setDesc(
        "Mostra input e output di ogni strumento eseguito durante la richiesta, in blocchi apribili con un clic."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showToolIO)
          .onChange(async (value) => {
            this.plugin.settings.showToolIO = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h2", { text: "Diagrammi TikZ (MiKTeX)" });

    new Setting(containerEl)
      .setName("Render dei blocchi TikZ con TeX locale")
      .setDesc(
        "Rende i blocchi ```tikz delle note e della chat con il TeX installato sul sistema (MiKTeX). Supporta TUTTE le librerie esterne (pgfplots, circuitikz, tikz-cd, forest, ecc.) che TikZJax non può caricare. Il rendering avviene prima del plugin TikZJax, quindi ha la precedenza."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.tikzEnabled)
          .onChange(async (value) => {
            this.plugin.settings.tikzEnabled = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Anteprima in modifica (live preview)")
      .setDesc(
        "Mostra l'immagine TikZ anche nella modalità modifica, sotto il blocco di codice. L'anteprima viene aggiornata automaticamente quando il codice cambia."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.tikzLivePreview)
          .onChange(async (value) => {
            this.plugin.settings.tikzLivePreview = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Motore di rendering")
      .setDesc(
        "auto = prova pdflatex+dvisvgm e ripiega su latex+dvisvgm. 'pdf' è più compatibile con i pacchetti moderni, 'dvi' è più tradizionale."
      )
      .addDropdown((dd) =>
        dd
          .addOption("auto", "Auto (consigliato)")
          .addOption("pdf", "pdflatex + dvisvgm (PDF)")
          .addOption("dvi", "latex + dvisvgm (DVI)")
          .setValue(this.plugin.settings.tikzEngine)
          .onChange(async (value) => {
            this.plugin.settings.tikzEngine = value as TikzEngine;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Percorso binario latex/pdflatex")
      .setDesc(
        "Lascia vuoto per la ricerca automatica nel PATH (consigliato). Usa il percorso completo solo se serve, es. C:/Users/giuli/AppData/Local/Programs/MiKTeX/miktex/bin/x64/pdflatex.exe"
      )
      .addText((text) =>
        text
          .setPlaceholder("(auto)")
          .setValue(this.plugin.settings.tikzLatexBin)
          .onChange(async (value) => {
            this.plugin.settings.tikzLatexBin = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Percorso binario dvisvgm")
      .setDesc("Lascia vuoto per la ricerca automatica nel PATH (consigliato).")
      .addText((text) =>
        text
          .setPlaceholder("(auto)")
          .setValue(this.plugin.settings.tikzDvisvgmBin)
          .onChange(async (value) => {
            this.plugin.settings.tikzDvisvgmBin = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Preambolo aggiuntivo")
      .setDesc(
        "Linee da aggiungere al preambolo di ogni rendering. Utile per caricare librerie usate di frequente, es. \\usepackage{pgfplots} oppure \\usetikzlibrary{positioning, arrows.meta}."
      )
      .addTextArea((text) =>
        text
          .setPlaceholder("\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}")
          .setValue(this.plugin.settings.tikzExtraPreamble)
          .onChange(async (value) => {
            this.plugin.settings.tikzExtraPreamble = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Testa rendering TikZ")
      .setDesc("Esegue un diagramma di prova con pgfplots, circuitikz e librerie per verificare la configurazione.")
      .addButton((btn) =>
        btn.setButtonText("Test").onClick(async () => {
          btn.setDisabled(true);
          btn.setButtonText("Rendering in corso...");
          try {
            await this.plugin.tikzRenderer.render(
              "\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}\n\\usepackage[siunitx]{circuitikz}\n\\usetikzlibrary{positioning, arrows.meta}\n\\begin{tikzpicture}\n\\draw (0,0) to[R=1k] (3,0);\n\\node[draw, right=1cm of {(3,0)}] (b) {OK};\n\\draw[-{Stealth}] (3,0) -- (b);\n\\end{tikzpicture}"
            );
            new Notice("Rendering TikZ riuscito: la configurazione MiKTeX funziona.");
          } catch (e) {
            new Notice(`Errore rendering TikZ: ${(e as Error).message}`);
          } finally {
            btn.setDisabled(false);
            btn.setButtonText("Test");
          }
        })
      );

    new Setting(containerEl)
      .setName("Svuota cache rendering")
      .setDesc("Elimina gli SVG già compilati (utile dopo modifiche al preambolo o per liberare spazio).")
      .addButton((btn) =>
        btn.setButtonText("Svuota").onClick(() => {
          this.plugin.tikzRenderer.clearCache();
          new Notice("Cache TikZ svuotata.");
        })
      );

    new Setting(containerEl)
      .setName("Testa connessione")
      .setDesc("Esegue 'opencode --version' per verificare che il binario sia raggiungibile.")
      .addButton((btn) =>
        btn.setButtonText("Test").onClick(async () => {
          btn.setDisabled(true);
          btn.setButtonText("Test in corso...");
          try {
            const version = await this.plugin.runner.getVersion();
            new Notice(`Opencode trovato: ${version}`);
          } catch (e) {
            new Notice(`Errore: ${(e as Error).message}`);
          } finally {
            btn.setDisabled(false);
            btn.setButtonText("Test");
          }
        })
      );
  }

  private async populateModelDropdown(dd: DropdownComponent): Promise<void> {
    const cur = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    const seen = new Set<string>();
    const addOption = (value: string, display: string) => {
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
      addOption("", `Errore: ${(e as Error).message}`);
    }
  }
}