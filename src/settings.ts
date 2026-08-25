import { App, DropdownComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import type OpencodePlugin from "./main";
import type { Language } from "./i18n";

export interface OpencodeSettings {
  language: Language;
  binaryPath: string;
  anydocEnabled: boolean;
  anydocBinary: string;
  model: string;
  agent: string;
  autoApprove: boolean;
  showThinking: boolean;
  showToolIO: boolean;
  sessionId: string;
  pinned: string[];
}

export const DEFAULT_SETTINGS: OpencodeSettings = {
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
};

export class OpencodeSettingTab extends PluginSettingTab {
  plugin: OpencodePlugin;

  constructor(app: App, plugin: OpencodePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const t = (s: string) => this.plugin.t(s);
    containerEl.empty();

    containerEl.createEl("h2", { text: "Opencode Vault" });

    new Setting(containerEl)
      .setName(t("Language"))
      .setDesc(t(
        "Interface language. English is the default. Some command names update after reloading Obsidian."
      ))
      .addDropdown((dd) =>
        dd
          .addOption("en", t("English"))
          .addOption("it", t("Italian"))
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as Language;
            await this.plugin.saveSettings();
            new Notice(t("Language changed. Reload Obsidian to apply it everywhere."));
            this.display();
          })
      );

    new Setting(containerEl)
      .setName(t("Binary path"))
      .setDesc(t(
        "Command or full path to the opencode executable. Usually 'opencode' is enough if it is on your PATH. If you have issues, use the full path (e.g. on Windows .../npm/opencode.cmd, on macOS/Linux .../bin/opencode)."
      ))
      .addText((text) =>
        text
          .setPlaceholder("opencode")
          .setValue(this.plugin.settings.binaryPath)
          .onChange(async (value) => {
            this.plugin.settings.binaryPath = value.trim() || "opencode";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Convert documents with anydoc"))
      .setDesc(t(
        "Run anydoc on attached documents (PDF, Word, Excel, etc.) and attach them as Markdown instead of the original file. Install with: npm install -g @firecrawl/anydoc"
      ))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.anydocEnabled)
          .onChange(async (value) => {
            this.plugin.settings.anydocEnabled = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Anydoc binary path"))
      .setDesc(t("Command or full path to the anydoc executable (npm install -g @firecrawl/anydoc)."))
      .addText((text) =>
        text
          .setPlaceholder("anydoc")
          .setValue(this.plugin.settings.anydocBinary)
          .onChange(async (value) => {
            this.plugin.settings.anydocBinary = value.trim() || "anydoc";
            await this.plugin.saveSettings();
          })
      );

    const modelSetting = new Setting(containerEl)
      .setName(t("Model"))
      .setDesc(t(
        "Pick a model from the opencode list. The same selector is also available in the chat bar. The default uses the OpenCode Go provider (the same as the desktop app)."
      ));

    modelSetting.addDropdown((dd) => {
      this.populateModelDropdown(dd);
    });

    new Setting(containerEl)
      .setName(t("Refresh model list"))
      .setDesc(t("Reload the list of available models from opencode."))
      .addButton((btn) =>
        btn.setButtonText(t("Refresh")).onClick(() => {
          this.display();
        })
      );

    new Setting(containerEl)
      .setName(t("Agent"))
      .setDesc(t("The opencode agent to use (e.g. build, plan). Leave empty for the default."))
      .addText((text) =>
        text
          .setPlaceholder(t("e.g. build"))
          .setValue(this.plugin.settings.agent)
          .onChange(async (value) => {
            this.plugin.settings.agent = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Session ID"))
      .setDesc(t(
        "The persistent session id used for the chat. It is managed automatically: the first time a new session starts, then it is reused. Empty = new session on the next message."
      ))
      .addText((text) =>
        text
          .setPlaceholder(t("(automatic)"))
          .setValue(this.plugin.settings.sessionId)
          .onChange(async (value) => {
            this.plugin.settings.sessionId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Reset session"))
      .setDesc(t("Clear the saved session and start from scratch on the next message."))
      .addButton((btn) =>
        btn.setButtonText(t("Reset")).onClick(async () => {
          this.plugin.settings.sessionId = "";
          await this.plugin.saveSettings();
          new Notice(t("Session reset: the next message will start from a new session."));
        })
      );

    new Setting(containerEl)
      .setName(t("Auto-approve permissions"))
      .setDesc(t(
        "Automatically allow the tool permissions (bash, file edits, etc.). In non-interactive mode opencode would deny everything without this flag. Turn it off for extra safety."
      ))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoApprove)
          .onChange(async (value) => {
            this.plugin.settings.autoApprove = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Show reasoning"))
      .setDesc(t("Show the model's reasoning blocks (uses the --thinking flag)."))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showThinking)
          .onChange(async (value) => {
            this.plugin.settings.showThinking = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Show tool details"))
      .setDesc(t(
        "Show the input and output of every tool executed during the request, in collapsible blocks."
      ))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showToolIO)
          .onChange(async (value) => {
            this.plugin.settings.showToolIO = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Test connection"))
      .setDesc(t("Run 'opencode --version' to verify the binary is reachable."))
      .addButton((btn) =>
        btn.setButtonText(t("Test")).onClick(async () => {
          btn.setDisabled(true);
          btn.setButtonText(t("Testing..."));
          try {
            const version = await this.plugin.runner.getVersion();
            new Notice(`${t("Opencode found:")} ${version}`);
          } catch (e) {
            new Notice(`${t("Error:")} ${(e as Error).message}`);
          } finally {
            btn.setDisabled(false);
            btn.setButtonText(t("Test"));
          }
        })
      );
  }

  private async populateModelDropdown(dd: DropdownComponent): Promise<void> {
    const t = (s: string) => this.plugin.t(s);
    const cur = this.plugin.settings.model || DEFAULT_SETTINGS.model;
    const seen = new Set<string>();
    const addOption = (value: string, display: string) => {
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
      addOption("", `${t("Error:")} ${(e as Error).message}`);
    }
  }
}