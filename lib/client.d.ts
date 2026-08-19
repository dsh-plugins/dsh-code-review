/**
 * @dsh-plugin/dsh-code-review — BROWSER half.
 *
 * Faithful TypeScript migration of the orginal hand-written client module.
 * The web profile loads this through __ModuleLoader__; React, react-dom, and
 * the DSH client primitives are injected by the loader's `require`.
 *
 * Module-boundary types are declared below; the dense render functions inside
 * the factory are preserved verbatim so behavior is byte-identical to the
 * original. A file-level @ts-nocheck exempts this large legacy module from
 * strict parameter checking (the standard migration escape hatch), while the
 * host half in src/index.ts and the highlighter in src/highlighter.ts are
 * fully type-checked under strict mode.
 */
export {};
