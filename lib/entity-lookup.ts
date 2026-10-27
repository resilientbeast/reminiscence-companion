import type { Anchor } from "./planner-contracts.ts";
import type { Kind } from "./contracts.ts";

// One current lookup, bounded short-lived cache, and no stale result/error delivery.
export function createEntityLookup(endpoint: string, fetcher: typeof fetch = fetch, now = Date.now) {
  const cache = new Map<string, { results: Anchor[]; expires: number }>();
  let generation = 0;
  let active: { key: string; controller: AbortController; promise: Promise<Anchor[] | null> } | undefined;
  function cancel() { generation++; active?.controller.abort(); active = undefined; }
  function run(query: string, kind: Kind): Promise<Anchor[] | null> {
    const trimmed = query.trim();
    const key = `${kind}:${trimmed.toLowerCase()}`;
    if (active?.key === key) return active.promise;
    cancel();
    if (trimmed.length < 2 || trimmed.length > 100) return Promise.resolve([]);
    const cached = cache.get(key);
    const current = generation;
    if (cached && cached.expires > now()) return Promise.resolve().then(() => current === generation ? cached.results : null);
    const controller = new AbortController();
    const promise = Promise.resolve().then(async () => {
      try {
        const response = await fetcher(`${endpoint}/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: trimmed, kind }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) });
        const body = await response.json();
        if (current !== generation) return null;
        if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Search is unavailable. Try again.");
        const results = body.results as Anchor[];
        if (!Array.isArray(results)) throw new Error("Search returned an unreadable response. Try again.");
        if (cache.size >= 30) cache.delete(cache.keys().next().value!);
        cache.set(key, { results, expires: now() + 120_000 });
        return results;
      } catch (error) {
        if (current !== generation || controller.signal.aborted) return null;
        throw error;
      } finally { if (current === generation) active = undefined; }
    });
    active = { key, controller, promise };
    return promise;
  }
  return { run, cancel };
}
