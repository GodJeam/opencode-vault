# Opencode Vault

An **Obsidian** plugin that integrates **opencode** directly into your vault: chat with opencode, analyze notes, attach files, and manage sessions without leaving Obsidian.

> **Note**: this project was entirely generated using large language models (LLMs) via opencode. The code received **little personal review**: use it with due caution, test it, and report or fix any issues you find.

## Features

- **Chat with opencode** in an Obsidian pane, with streaming responses and Markdown rendering.
- **Quick commands**: `/` for commands (model, new session, current note, attach file, stats, pin, rename), `@` to attach vault files, `!` for quick actions.
- **Inline model picker** in the prompt box (list shown above the composer, like opencode desktop).
- **Multiple chat windows**: side-by-side chat panes, each with its own session.
- **Session management**: pin, rename, delete; the list shows pinned sessions plus the 10 most recent.
- **Persistent per-session history** stored in Obsidian (last 100 messages per session).
- **Reasoning and executed steps**: shows the model's reasoning and the tools used (with expandable input/output).
- **Token and cost stats**: per-message and totals (5 hours, week, month).
- **Continue past the context limit**: when a session reaches its token limit, a command summarizes/continues in a new session (with fallback on local history).

## Requirements

- Obsidian (desktop, Windows/macOS/Linux)
- opencode CLI installed and reachable (e.g. `npm install -g opencode-ai`), with authenticated providers (`opencode auth login`)

### Platform requirements

The plugin is cross-platform: the chat, sessions, `/ @ !` commands, stats, and history management work on **Windows, macOS, and Linux**.

On **all** platforms:
- **Node.js** (to build the plugin) and the **opencode CLI** on your `PATH`.

### Build requirements

```bash
npm install
npm run build
```

## Installation

1. Clone the repo and build:

```bash
git clone https://github.com/GodJeam/opencode-vault.git
cd opencode-vault
npm install
npm run build
```

2. Copy the generated files into your vault:

```
<vault>/.obsidian/plugins/opencode-vault/
    ├── main.js
    ├── manifest.json
    └── styles.css
```

3. In Obsidian: Settings → Community plugins → enable **Opencode Vault**.

## Usage

- Open the chat from the sidebar icon or the command palette (`Ctrl+P` → "New opencode chat").
- In the plugin settings, verify the binary path (default `opencode`) and the model.
- Use **"Continue in a new session (by summarizing)"** to keep going when a session saturates its context.

## Structure

- `src/main.ts` — entry point and commands
- `src/chatView.ts` — chat view and UI
- `src/opencodeRunner.ts` — CLI execution and event parsing
- `src/settings.ts` — settings
- `src/modals.ts` — modal dialogs (rename, stats, confirm, attachments)

## License

GPL-3.0 — see [LICENSE](LICENSE).