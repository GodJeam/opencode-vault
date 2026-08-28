# Opencode Vault

An **Obsidian** plugin that integrates **opencode** directly into your vault: chat with opencode, analyze notes, attach files, and manage sessions without leaving Obsidian.

> **Note**: this project was entirely generated using large language models (LLMs) via opencode. The code received **little personal review**: use it with due caution, test it, and report or fix any issues you find.

## Features

- **Chat with opencode** in an Obsidian pane, with streaming responses.
- **Slash commands**: `/` for actions (model, new session, stats, prompts, ...), `@` to attach vault files, `!` for quick actions.
- **Reusable prompt templates** inserted in the chat with `/prompt`.
- **Multiple chat windows**, each with its own session, to work on several sessions at the same time.
- **Session management**: pin, rename and delete sessions.
- **Document conversion**: PDF, Word, Excel, etc. are converted to Markdown with [anydoc](https://github.com/firecrawl/anydoc) before being sent, so any model can read them.
- **Context and cost awareness**: session context usage bar, token/cost stats, and a live indicator of whether the model is still working or stuck.
- **Continue past the context limit**: when a session saturates, summarize and continue in a new session.

## Requirements

- Obsidian (desktop, Windows/macOS/Linux)
- opencode CLI installed and reachable (e.g. `npm install -g opencode-ai`), with authenticated providers (`opencode auth login`)
- [anydoc](https://github.com/firecrawl/anydoc) (optional, for document conversion): `npm install -g @firecrawl/anydoc`

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
- The interface is in **English** by default; switch to Italian in Settings → Language (reload Obsidian to apply everywhere).
- Save reusable **prompt templates** in Settings → Prompt templates and insert them in the chat with `/prompt`.

## Structure

- `src/` — TypeScript source
- `build/` — build tooling (esbuild config, tsconfig)
- `main.js` / `manifest.json` / `styles.css` — built plugin files (copy into the vault)

## License

GPL-3.0 — see [LICENSE](LICENSE).