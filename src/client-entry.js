// Client bundle entry: runs the plugin-owned Shiki highlighter (side effect)
// then loads the browser client module under the web profile's __ModuleLoader__.
// Both are compiled from TypeScript into lib/ by `tsc` before this bundle runs.
import "../lib/highlighter.js";
import "../lib/client.js";
