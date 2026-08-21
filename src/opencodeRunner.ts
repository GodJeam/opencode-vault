import { spawn, type ChildProcess, type SpawnOptions } from "child_process";
import { existsSync, readFileSync } from "fs";
import { basename, dirname, join } from "path";
import { createServer, type AddressInfo } from "net";
import { FileSystemAdapter } from "obsidian";
import type OpencodePlugin from "./main";
import { DEFAULT_SETTINGS, type OpencodeSettings } from "./settings";

export interface RunHandle {
  abort: () => void;
}

export interface SessionInfo {
  id: string;
  title?: string;
  updated?: number;
  created?: number;
  projectId?: string;
  directory?: string;
}

export interface StepInfo {
  id: string;
  tool: string;
  title: string;
  state: string;
  input?: unknown;
  output?: unknown;
}

export interface FinishInfo {
  tokens?: {
    total?: number;
    input?: number;
    output?: number;
    reasoning?: number;
  };
  cost?: number;
}

export interface UsageWindow {
  input: number;
  output: number;
  cost: number;
}

export interface UsageStats {
  h5: UsageWindow;
  week: UsageWindow;
  month: UsageWindow;
}

export interface StreamCallbacks {
  onSession: (sessionId: string) => void;
  onText: (text: string, partId: string) => void;
  onReasoning: (text: string, partId: string) => void;
  onStep: (step: StepInfo) => void;
  onFinish: (info: FinishInfo) => void;
  onError: (message: string) => void;
  onDone: (exitCode: number) => void;
  onRaw?: (line: string) => void;
}

export class OpencodeRunner {
  private plugin: OpencodePlugin;
  private resolvedBinary: string | null = null;
  private resolvedBinaryTried = false;
  private modelsCache: string[] | null = null;
  private modelsCacheAt = 0;
  private sessionsCache: SessionInfo[] | null = null;
  private sessionsCacheAt = 0;
  private serverProc: ChildProcess | null = null;
  private serverBaseUrl: string | null = null;
  private serverPassword = "";
  private serverReady: Promise<string> | null = null;

  constructor(plugin: OpencodePlugin) {
    this.plugin = plugin;
  }

  getVersion(): Promise<string> {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      const [bin, args] = this.buildCommand(s, ["--version"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      child.stdout?.on("data", (d: Buffer) => (out += d.toString()));
      child.stderr?.on("data", (d: Buffer) => (err += d.toString()));
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0 && out.trim()) resolve(out.trim().split("\n")[0]);
        else reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
      });
    });
  }

  listModels(force = false): Promise<string[]> {
    if (!force && this.modelsCache && Date.now() - this.modelsCacheAt < 10_000) {
      return Promise.resolve(this.modelsCache);
    }
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      const [bin, args] = this.buildCommand(s, ["models"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      child.stdout?.on("data", (d: Buffer) => (out += d.toString()));
      child.stderr?.on("data", (d: Buffer) => (err += d.toString()));
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) {
          const models = out
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => /^[a-zA-Z0-9_.:/+-]+$/.test(l))
            .sort();
          this.modelsCache = models;
          this.modelsCacheAt = Date.now();
          resolve(models);
        } else {
          reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
        }
      });
    });
  }

  listSessions(force = false): Promise<SessionInfo[]> {
    if (!force && this.sessionsCache && Date.now() - this.sessionsCacheAt < 2_000) {
      return Promise.resolve(this.sessionsCache);
    }
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      const [bin, args] = this.buildCommand(s, ["session", "list", "--format", "json"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      child.stdout?.on("data", (d: Buffer) => (out += d.toString()));
      child.stderr?.on("data", (d: Buffer) => (err += d.toString()));
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) {
          try {
            const arr = JSON.parse(out);
            const sessions = Array.isArray(arr) ? (arr as SessionInfo[]) : [];
            this.sessionsCache = sessions;
            this.sessionsCacheAt = Date.now();
            resolve(sessions);
          } catch {
            resolve([]);
          }
        } else {
          reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
        }
      });
    });
  }

  renameSession(sessionId: string, title: string): Promise<void> {
    const escaped = title.replace(/'/g, "''");
    const query = `UPDATE session SET title='${escaped}' WHERE id='${sessionId}'`;
    return this.runDbQuery(query).then(() => undefined);
  }

  deleteSession(sessionId: string): Promise<void> {
    return this.execCli(["session", "delete", sessionId]).then(() => undefined);
  }

  execCli(args: string[]): Promise<string> {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      const [bin, spawnArgs] = this.buildCommand(s, args);
      const child = this.spawnBinary(bin, spawnArgs);
      let out = "";
      let err = "";
      child.stdout?.on("data", (d: Buffer) => (out += d.toString()));
      child.stderr?.on("data", (d: Buffer) => (err += d.toString()));
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) resolve(out);
        else reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
      });
    });
  }

  getUsageStats(): Promise<UsageStats> {
    const now = Date.now();
    const t5h = now - 5 * 3600 * 1000;
    const t7d = now - 7 * 24 * 3600 * 1000;
    const t30d = now - 30 * 24 * 3600 * 1000;
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
      const r = (rows[0] ?? {}) as Record<string, unknown>;
      const num = (v: unknown): number => Number(v ?? 0);
      return {
        h5: { input: num(r.h5_input), output: num(r.h5_output), cost: num(r.h5_cost) },
        week: { input: num(r.w_input), output: num(r.w_output), cost: num(r.w_cost) },
        month: { input: num(r.m_input), output: num(r.m_output), cost: num(r.m_cost) },
      };
    });
  }

  runDbQuery(query: string): Promise<unknown[]> {
    const s = this.plugin.settings;
    return new Promise((resolve, reject) => {
      const [bin, args] = this.buildCommand(s, ["db", query, "--format", "json"]);
      const child = this.spawnBinary(bin, args);
      let out = "";
      let err = "";
      child.stdout?.on("data", (d: Buffer) => (out += d.toString()));
      child.stderr?.on("data", (d: Buffer) => (err += d.toString()));
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0) {
          try {
            const arr = JSON.parse(out);
            resolve(Array.isArray(arr) ? arr : []);
          } catch {
            resolve([]);
          }
        } else {
          reject(new Error(err.trim() || out.trim() || `exit code ${code}`));
        }
      });
    });
  }

  runStream(prompt: string, fileAttachments: string[], cb: StreamCallbacks): RunHandle {
    // Con il server persistente si evita di spawnare un processo per messaggio.
    // Per gli allegati si usa comunque il percorso CLI (testato con --file).
    if (fileAttachments.length === 0) {
      return this.tryServerRun(prompt, cb);
    }
    return this.cliRunStream(prompt, fileAttachments, cb);
  }

  private cliRunStream(prompt: string, fileAttachments: string[], cb: StreamCallbacks): RunHandle {
    const s = this.plugin.settings;
    const args = ["run", "--format", "json"];
    if (s.sessionId) args.push("--session", s.sessionId);
    // Il modello deve essere sempre esplicito: senza --model `run` va in hang.
    args.push("--model", s.model || DEFAULT_SETTINGS.model);
    if (s.agent) args.push("--agent", s.agent);
    if (s.autoApprove) args.push("--auto");
    if (s.showThinking) args.push("--thinking");
    // IMPORTANTE: il prompt va PRIMA dei flag --file (--file è variadico e
    // consuma tutti gli argomenti successivi come percorsi file).
    args.push(prompt);
    for (const f of fileAttachments) args.push("--file", f);

    const [bin, spawnArgs] = this.buildCommand(s, args);
    const adapter = this.plugin.app.vault.adapter;
    const cwd = adapter instanceof FileSystemAdapter ? adapter.getBasePath() : undefined;
    const child = this.spawnBinary(bin, spawnArgs, cwd);

    let buffer = "";
    child.stdout?.on("data", (d: Buffer) => {
      buffer += d.toString();
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line) this.handleLine(line, cb);
      }
    });
    child.stdout?.on("end", () => {
      if (buffer.trim()) this.handleLine(buffer.trim(), cb);
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (cb.onRaw) cb.onRaw(d.toString());
    });
    child.on("error", (e) => cb.onError(e.message));
    child.on("close", (code) => {
      cb.onDone(code ?? -1);
    });
    return { abort: () => this.killProc(child) };
  }

  // ===== Server persistente (opencode serve) =====

  stopServer(): void {
    if (this.serverProc) {
      this.killProc(this.serverProc);
      this.serverProc = null;
    }
    this.serverBaseUrl = null;
    this.serverReady = null;
  }

  private tryServerRun(prompt: string, cb: StreamCallbacks): RunHandle {
    const ac = new AbortController();
    let finished = false;
    let xhr: XMLHttpRequest | null = null;
    let sid: string | null = null;
    let cliHandle: RunHandle | null = null;

    const finish = (code: number) => {
      if (!finished) {
        finished = true;
        cb.onDone(code);
      }
    };

    void (async () => {
      try {
        const baseUrl = await this.ensureServer();
        sid = await this.ensureSession(baseUrl, cb);
        await new Promise<void>((resolveStream) => {
          const ctx: { assistantId: string | null } = { assistantId: null };
          xhr = this.openEventStream(baseUrl, (ev) => this.handleServerEvent(ev, sid!, cb, ctx));
          // Il POST sincrono risolve quando la risposta è completa; lo SSE
          // serve solo per lo streaming live durante l'attesa.
          void this.postMessage(baseUrl, sid!, prompt)
            .then(() => resolveStream())
            .catch((e) => {
              cb.onError(e instanceof Error ? e.message : String(e));
              resolveStream();
            });
        });
        finish(0);
      } catch (e) {
        if (ac.signal.aborted) {
          finish(1);
          return;
        }
        // Il server non è partito: ricadi sul percorso CLI (senza allegati).
        cliHandle = this.cliRunStream(prompt, [], cb);
      }
    })();

    return {
      abort: () => {
        ac.abort();
        if (xhr) xhr.abort();
        if (sid && this.serverBaseUrl) {
          void this.serverRequest(this.serverBaseUrl, "POST", `/session/${sid}/abort`);
        }
        cliHandle?.abort();
        finish(1);
      },
    };
  }

  private async ensureServer(): Promise<string> {
    if (this.serverReady) return this.serverReady;
    this.serverReady = this.startServer().catch((e) => {
      this.serverReady = null;
      this.stopServer();
      throw e;
    });
    return this.serverReady;
  }

  private async startServer(): Promise<string> {
    const s = this.plugin.settings;
    const adapter = this.plugin.app.vault.adapter;
    const cwd = adapter instanceof FileSystemAdapter ? adapter.getBasePath() : undefined;
    this.serverPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const port = await this.pickFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;

    const proc = this.spawnBinary(
      s.binaryPath,
      ["serve", "--port", String(port), "--hostname", "127.0.0.1"],
      cwd,
      { OPENCODE_SERVER_PASSWORD: this.serverPassword }
    );
    this.serverProc = proc;
    proc.on("exit", () => {
      if (this.serverProc === proc) this.serverProc = null;
      this.serverBaseUrl = null;
      this.serverReady = null;
    });

    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      try {
        const r = await this.serverRequest(baseUrl, "GET", "/global/health");
        if (r.status === 200) {
          this.serverBaseUrl = baseUrl;
          return baseUrl;
        }
      } catch {
        // riprova
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Impossibile avviare opencode serve (timeout)");
  }

  private pickFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const srv = createServer();
      srv.once("error", reject);
      srv.listen(0, "127.0.0.1", () => {
        const port = (srv.address() as AddressInfo).port;
        srv.close(() => resolve(port));
      });
    });
  }

  private authHeader(): string {
    return "Basic " + btoa(`opencode:${this.serverPassword}`);
  }

  private async serverRequest(
    baseUrl: string,
    method: string,
    path: string,
    body?: unknown
  ): Promise<{ status: number; text: string }> {
    const headers: Record<string, string> = { Authorization: this.authHeader() };
    let data: string | undefined;
    if (body !== undefined) {
      data = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${baseUrl}${path}`, { method, headers, body: data });
    return { status: res.status, text: await res.text() };
  }

  private async ensureSession(baseUrl: string, cb: StreamCallbacks): Promise<string> {
    const existing = this.plugin.settings.sessionId;
    if (existing) return existing;
    const r = await this.serverRequest(baseUrl, "POST", "/session", {});
    let sid = "";
    try {
      sid = String(JSON.parse(r.text).id);
    } catch {
      // ignora
    }
    if (!sid) throw new Error(`Creazione sessione fallita: ${r.status}`);
    cb.onSession(sid);
    return sid;
  }

  private async postMessage(baseUrl: string, sid: string, prompt: string): Promise<void> {
    const s = this.plugin.settings;
    const model = s.model || DEFAULT_SETTINGS.model;
    const slash = model.indexOf("/");
    const providerID = slash >= 0 ? model.slice(0, slash) : "";
    const modelID = slash >= 0 ? model.slice(slash + 1) : model;
    const body: Record<string, unknown> = {
      parts: [{ type: "text", text: prompt }],
      model: { providerID, modelID },
    };
    if (s.agent) body.agent = s.agent;
    const r = await this.serverRequest(baseUrl, "POST", `/session/${sid}/message`, body);
    if (r.status !== 200) {
      throw new Error(`Invio messaggio fallito: ${r.status} ${r.text.slice(0, 200)}`);
    }
  }

  private openEventStream(
    baseUrl: string,
    onEvent: (ev: unknown) => void
  ): XMLHttpRequest {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${baseUrl}/event`, true);
    xhr.setRequestHeader("Authorization", this.authHeader());
    let buffer = "";
    let lastLen = 0;
    xhr.onprogress = () => {
      const text = xhr.responseText;
      const chunk = text.slice(lastLen);
      lastLen = text.length;
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line.startsWith("data:")) {
          try {
            onEvent(JSON.parse(line.slice(5).trim()));
          } catch {
            // ignora righe non JSON
          }
        }
      }
    };
    xhr.send();
    return xhr;
  }

  private handleServerEvent(
    ev: unknown,
    sid: string,
    cb: StreamCallbacks,
    ctx: { assistantId: string | null }
  ): void {
    const e = ev as { type?: string; properties?: Record<string, unknown> };
    const props = e.properties ?? {};
    const evSid = props.sessionID;
    if (typeof evSid === "string" && evSid !== sid) return;

    switch (e.type) {
      case "session.error":
        cb.onError(this.errorMessage(props.error));
        break;
      case "message.updated": {
        const info = props.info as
          | { role?: string; id?: string; tokens?: FinishInfo["tokens"]; cost?: number }
          | undefined;
        if (info?.role === "assistant") {
          if (!ctx.assistantId && info.id) ctx.assistantId = info.id;
          if (info.tokens || info.cost !== undefined) {
            cb.onFinish({ tokens: info.tokens, cost: info.cost });
          }
        }
        break;
      }
      case "message.part.updated": {
        const part = props.part as
          | {
              type?: string;
              text?: unknown;
              id?: string;
              messageID?: string;
              tool?: string;
              state?: { status?: string; title?: string; input?: unknown; output?: unknown };
            }
          | undefined;
        if (!part) break;
        // Ignora i part finché non conosciamo il messaggio dell'assistente,
        // altrimenti il testo dell'utente comparirebbe nella bolla di risposta.
        if (!ctx.assistantId || part.messageID !== ctx.assistantId) break;
        if (part.type === "text" && typeof part.text === "string") {
          cb.onText(part.text, String(part.id));
        } else if (part.type === "reasoning" && typeof part.text === "string") {
          cb.onReasoning(part.text, String(part.id));
        } else if (part.type === "tool") {
          const status = part.state?.status ?? "completed";
          const title = part.state?.title || part.tool || "Strumento";
          cb.onStep({
            id: String(part.id ?? "step-" + Date.now()),
            tool: String(part.tool),
            title: String(title),
            state: String(status),
            input: part.state?.input,
            output: part.state?.output,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  killProc(child: ChildProcess): void {
    if (!child || child.pid === undefined) return;
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
      } else {
        child.kill("SIGTERM");
      }
    } catch {
      // ignore
    }
  }

  private handleLine(line: string, cb: StreamCallbacks): void {
    let ev: any;
    try {
      ev = JSON.parse(line);
    } catch {
      cb.onRaw?.(line + "\n");
      return;
    }

    const sid = typeof ev.sessionID === "string" ? ev.sessionID : undefined;
    if (sid) cb.onSession(sid);

    const type = ev.type;
    const part = ev.part;
    switch (type) {
      case "text":
        if (part?.type === "text" && typeof part.text === "string") {
          cb.onText(part.text, String(part.id));
        }
        break;
      case "reasoning":
        if (typeof part?.text === "string") {
          cb.onReasoning(part.text, String(part.id));
        }
        break;
      case "tool_use":
        if (part?.type === "tool") {
          const state = part.state?.status || "completed";
          cb.onStep({
            id: String(part.callID || part.id || "step-" + Date.now()),
            tool: String(part.tool),
            title: String(part.state?.title || part.tool || "Strumento"),
            state: String(state),
            input: part.state?.input,
            output: part.state?.output,
          });
        }
        break;
      case "step_finish":
        cb.onFinish({
          tokens: part?.tokens,
          cost: typeof part?.cost === "number" ? part.cost : undefined,
        });
        break;
      case "error":
        cb.onError(this.errorMessage(ev.error));
        break;
      default:
        break;
    }

    // Fallback: un part di tipo "reasoning" può arrivare in eventi di altro tipo
    if (type !== "reasoning" && part?.type === "reasoning" && typeof part?.text === "string") {
      cb.onReasoning(part.text, String(part.id));
    }
  }

  private errorMessage(err: any): string {
    if (!err) return "Errore sconosciuto";
    const msg = err.data?.message || err.message || JSON.stringify(err);
    return String(msg);
  }

  private buildCommand(s: OpencodeSettings, args: string[]): [string, string[]] {
    return [s.binaryPath, args];
  }

  private spawnBinary(bin: string, args: string[], cwd?: string, extraEnv?: Record<string, string>): ChildProcess {
    const isWin = process.platform === "win32";
    const resolved = isWin ? this.resolveBinary(bin) : null;
    const shell = isWin && !resolved && !(bin.includes("\\") || bin.includes("/"));
    const options: SpawnOptions = {
      cwd,
      shell,
      windowsHide: true,
      env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
      // IMPORTANTE: stdin deve essere "ignore", non "pipe". Con stdin a pipe
      // `opencode run` resta in hang senza produrre output su Windows.
      stdio: ["ignore", "pipe", "pipe"],
    };
    return spawn(resolved ?? bin, args, options);
  }

  private resolveBinary(bin: string): string | null {
    if (!this.resolvedBinaryTried) {
      this.resolvedBinaryTried = true;
      this.resolvedBinary = this.findWindowsBinary(bin);
    }
    return this.resolvedBinary;
  }

  private findWindowsBinary(bin: string): string | null {
    if (bin.toLowerCase().endsWith(".exe")) return bin;
    const hasPath = bin.includes("\\") || bin.includes("/");
    if (hasPath) {
      const resolved = this.resolveCmdShim(bin);
      if (resolved) return resolved;
      // fallback: prova un .exe accanto allo shim
      const dir = dirname(bin);
      const exe = join(dir, basename(bin).replace(/\.(cmd|bat|ps1)$/i, "") + ".exe");
      return existsSync(exe) ? exe : null;
    }
    const dirs = (process.env.PATH ?? "").split(";").filter(Boolean);
    for (const dir of dirs) {
      const cmdPath = join(dir, bin + ".cmd");
      const exePath = join(dir, bin + ".exe");
      if (existsSync(cmdPath)) {
        const resolved = this.resolveCmdShim(cmdPath);
        if (resolved) return resolved;
      }
      if (existsSync(exePath)) return exePath;
    }
    return null;
  }

  private resolveCmdShim(shimPath: string): string | null {
    try {
      const content = readFileSync(shimPath, "utf8");
      const dir = dirname(shimPath);
      const m = content.match(/"([^"]+\.exe)"/i);
      if (m) {
        const target = m[1].replace(/%dp0%/gi, dir).replace(/%base%/gi, dir);
        if (existsSync(target)) return target;
      }
    } catch {
      // ignora
    }
    return null;
  }
}