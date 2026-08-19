/**
 * @dsh-plugin/dsh-code-review — HOST half.
 *
 * Codex-style per-turn code change summaries, review tab, and guarded undo
 * for DeepSeek Harness. The host keeps a persistent per-session ledger of
 * file snapshots and diffs observed from `tools/result` / `session/event`,
 * exposes them over `/api/dsh-code-review`, and performs guarded undo with
 * sandbox policy + filesystem version checks.
 */
import z from "@deepseek-ai/schemastery";
import type { IncomingMessage, ServerResponse } from "node:http";
export declare const name = "@dsh-plugin/dsh-code-review";
export declare const inject: string[];
export declare const Config: z<Schemastery.ObjectS<{
    fontFamily: z<string, string>;
    highlightOverrides: z<string, string>;
}>, Schemastery.ObjectT<{
    fontFamily: z<string, string>;
    highlightOverrides: z<string, string>;
}>>;
/** Plugin runtime config (all optional; `z` defaults supply the standing values). */
export interface CodeReviewConfig {
    fontFamily?: string;
    highlightOverrides?: string;
}
export declare class HttpError extends Error {
    status: number;
    details: Record<string, unknown>;
    constructor(status: number, message: string, details?: Record<string, unknown>);
}
/** One normalized diff entry. */
export interface DiffRecord {
    path: string;
    oldText: string | null;
    newText: string;
}
export declare function normalizeDiffs(value: unknown): DiffRecord[];
/** Line add/remove counts for one before/after pair. */
export interface LineCounts {
    added: number;
    removed: number;
}
export declare function diffLineCounts(oldText: string | null, newText: string): LineCounts;
/** One Myers diff operation. */
export interface DiffOperation {
    kind: "context" | "del" | "add";
    text: string;
}
/** One rendered unified-diff row. */
export interface UnifiedRow {
    kind: "context" | "del" | "add";
    oldLine: number | null;
    newLine: number | null;
    text: string;
}
/** A unified-diff section: a hunk or an omitted-context gap. */
export interface UnifiedSection {
    kind: "gap" | "hunk";
    count?: number;
    rows?: UnifiedRow[];
}
/** A unified diff of one before/after pair. */
export interface UnifiedDiff {
    sections: UnifiedSection[];
    added: number;
    removed: number;
}
export declare function buildUnifiedDiff(oldText: string | null, newText: string, contextLines?: number): UnifiedDiff;
/** Aggregated line stats for a diff set. */
export interface DiffStats {
    added: number;
    removed: number;
}
export declare function summarizeDiffs(diffs: readonly DiffRecord[]): DiffStats;
/** One ledger record: a snapshot-backed or diff-only change to one file. */
export interface LedgerRecord {
    key: string;
    callId: string;
    rootCallId: string;
    turn: number;
    step?: number;
    path: string;
    cwd?: string;
    before: string | null;
    after: string;
    created: boolean;
    hasSnapshot: boolean;
    undone: boolean;
    diffs: DiffRecord[];
    ordinal: number;
    createdAt: number;
}
/** The in-memory state of one session ledger. */
export interface SessionState {
    sessionId: string;
    parentSessionId: string | null;
    ownerSessionId: string;
    ownerTurn: number | null;
    revision: number;
    records: LedgerRecord[];
}
/** A minimal view of one session event. */
export interface SessionEvent {
    type: string;
    time?: number;
    seq?: number;
    data?: any;
}
/** A minimal view of the DSH session. */
export interface LedgerSession {
    id: string;
    header: {
        cwd?: string;
        parentSession?: string;
    };
    events: SessionEvent[];
    seq: number;
}
/** A minimal view of the DSH agent. */
export interface LedgerAgent {
    id: string;
    status?: string;
    session: LedgerSession;
}
/** The result of resolving a snapshot chain for one file. */
export type SnapshotChainResult = {
    ok: true;
    records: LedgerRecord[];
    before: string | null;
    after: string;
} | {
    ok: false;
    reason: string;
};
export declare function resolveSnapshotChain(records: readonly LedgerRecord[], expectedAfter?: string): SnapshotChainResult;
/** One aggregated file in a review view. */
export interface FileReview {
    path: string;
    cwd?: string;
    diffs: DiffRecord[];
    unified: UnifiedDiff | null;
    oldText?: string | null;
    newText?: string | null;
    concurrentConflict: boolean;
    added: number;
    removed: number;
    changedLines: number;
}
/** One turn's review summary. */
export interface TurnReview {
    turn: number;
    files: FileReview[];
    added: number;
    removed: number;
    changedLines: number;
    changeCount: number;
    canUndo: boolean;
    undone: boolean;
    displayOnly: boolean;
}
/** The full review state exposed by the plugin API. */
export interface ReviewState {
    sessionId: string;
    revision: number;
    running: boolean;
    latestTurn: number | null;
    turns: TurnReview[];
    all: {
        files: FileReview[];
        added: number;
        removed: number;
        changedLines: number;
    };
}
/** The minimal session state `buildReviewState` consumes. */
export interface ReviewStateSource {
    sessionId: string;
    revision: number;
    records: (LedgerRecord & {
        sourceSessionId?: string;
    })[];
}
export declare function buildReviewState(state: ReviewStateSource, running?: boolean): ReviewState;
/** The sandboxed filesystem surface used by the ledger. */
export interface FsService {
    resolve(path: string, options?: {
        cwd?: string;
    }): Promise<unknown>;
    stat(target: unknown): Promise<{
        type: string;
        version: string;
        size: number;
    } | undefined>;
    readText(target: unknown): Promise<string>;
    writeText(target: unknown, content: string, expected?: unknown, signal?: unknown, sandboxPolicy?: unknown): Promise<{
        version: string;
        operation?: string;
        before?: string | null;
        after?: string;
    }>;
    processPath(target: unknown): string;
}
/** The `tools/result` execution context the ledger observes. */
export interface ToolExec {
    agent?: LedgerAgent;
    callId?: string;
    rootCallId?: string;
    id?: string;
}
/** A `tools/result` payload. */
export interface ToolResult {
    isError?: boolean;
    value?: unknown;
    meta?: {
        diffs?: unknown;
    };
}
/** The cordis/harness context surface the ledger touches. */
export interface LedgerContext {
    agents: {
        get(id: string): LedgerAgent | undefined;
        list(): LedgerAgent[];
    };
    fs: FsService;
    webServer: {
        register(options: {
            kind: string;
            path: string;
            handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
        }, label?: string): unknown;
    };
    sandboxPolicy: {
        resolve(scope?: unknown): unknown;
    };
    settings: {
        register(namespace: string, schema: unknown, options?: unknown): SettingsScope;
    };
    on(event: string, listener: (...args: any[]) => void): unknown;
    emit(event: string, ...args: unknown[]): void;
    effect(fn: () => unknown, label?: string): void;
}
/** The settings scope returned by `settings.register`. */
export interface SettingsScope {
    get(): Record<string, unknown>;
    replace(value: unknown): Promise<unknown> | unknown;
}
/** The ledger runtime created by {@link createLedgerRuntime}. */
export interface LedgerRuntime {
    load(): Promise<void>;
    scanSession(session: LedgerSession): void;
    observeToolResult(exec: ToolExec, result: ToolResult): void;
    observeSessionEvent(session: LedgerSession, event: SessionEvent): void;
    reviewState(sessionId: string): ReviewState;
    undoTurn(sessionId: string, turn: number): Promise<ReviewState>;
    flush(sessionId: string): Promise<void>;
}
export declare function createLedgerRuntime(ctx: LedgerContext, storageRoot?: string): LedgerRuntime;
export declare function apply(ctx: LedgerContext, config?: CodeReviewConfig): Promise<void>;
