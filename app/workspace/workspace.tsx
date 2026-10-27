"use client";

import { useCallback, useEffect, useState } from "react";
import Planner from "../planner";
import type { SavedSession, SessionSummary } from "../../lib/saved-session-contracts";
import type { SessionMemory } from "../../lib/session-memory";

export default function Workspace() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [initial, setInitial] = useState<SavedSession | undefined>();
  const [generation, setGeneration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [memory, setMemory] = useState<SessionMemory | undefined>();
  const [useMemory, setUseMemory] = useState(true);
  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/sessions", { cache: "no-store", signal: signal ?? AbortSignal.timeout(15_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your saved sessions could not be loaded.");
      setSessions(data.sessions); setMemory(data.memory); setLoaded(true);
      return data as { sessions: SessionSummary[]; memory: SessionMemory };
    } catch (error) { if (!signal?.aborted) { setLoaded(true); setMessage(error instanceof Error ? error.message : "Saved sessions are unavailable."); } }
  }, []);
  useEffect(() => { const controller = new AbortController(); void reload(controller.signal); return () => controller.abort(); }, [reload]);
  function mayReplace() { return !dirty || window.confirm("Opening another session will replace unsaved changes in this page. Continue?"); }
  async function startNew(remember = true) {
    if (!mayReplace()) return;
    setBusy(true); setMessage("");
    try {
      if (remember && !await reload()) { setMessage("Saved preferences could not be refreshed. Try again, or start without saved preferences."); return; }
      setUseMemory(remember); setInitial(undefined); setGeneration(value => value + 1); setDirty(false);
      setMessage(remember ? "A new session is ready with saved favourites, feedback and preferences. Review each activity for today." : "A new session is ready without remembered preferences. Your saved sessions are unchanged.");
    } finally { setBusy(false); }
  }
  async function open(id: string) {
    if (!mayReplace()) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/sessions/${id}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This session could not be opened.");
      setInitial(data.session); setGeneration(value => value + 1); setDirty(false);
      setMessage("Saved session opened. Previously accepted activities remain your choices; review them again for today. Explore to get fresh discoveries.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "This session could not be opened."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/sessions/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(15_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This session could not be deleted.");
      const refreshed = await reload();
      if (initial?.id === id) { setInitial(undefined); setUseMemory(Boolean(refreshed)); setGeneration(value => value + 1); setDirty(false); }
      setDeleteId(null); setMessage("Saved session deleted from your account. Remembered preferences now use the remaining saved sessions.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Deletion is unavailable."); }
    finally { setBusy(false); }
  }
  const onSaved = useCallback(async (saved: SavedSession) => {
    setInitial(saved);
    setSessions(current => [saved, ...current.filter(item => item.id !== saved.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setMessage("");
    await reload();
  }, [reload]);

  return <>
    <section className="library-section no-print" aria-labelledby="library-title"><div className="library-heading"><div><p className="eyebrow">Only in your account</p><h2 id="library-title">My saved sessions</h2><p className="small-note">Save up to 20 sessions. New sessions reuse saved favourites, feedback and discovery preferences. Save changes to carry them forward. Use this workspace for one person for now.</p></div><div className="new-session-actions"><button disabled={busy || !loaded} onClick={() => void startNew()}>+ New session</button><button className="text-button" disabled={busy} onClick={() => void startNew(false)}>Start without saved preferences</button></div></div>
      {message && <p role="status" className="status-message">{message}</p>}
      {!loaded ? <p role="status">Loading your sessions…</p> : sessions.length === 0 ? <p className="empty-state">Your first saved session will appear here. Start with a favourite below.</p> : <div className="library-grid">{sessions.map(session => <article className="saved-card" key={session.id}><span className="sample-kind">{session.phase === "finished" ? "Finished session" : session.phase === "active" ? "Session in progress" : "Planning"}</span><h3>{session.title}</h3><p>{session.activityCount} activities · {session.minutes} minutes<br />Saved <time dateTime={session.updatedAt}>{new Date(session.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time></p><div className="button-row"><button className="primary-button" disabled={busy} onClick={() => void open(session.id)}>Open session</button>{deleteId === session.id ? <><button disabled={busy} onClick={() => void remove(session.id)}>Confirm delete</button><button onClick={() => setDeleteId(null)}>Cancel</button></> : <button disabled={busy} onClick={() => setDeleteId(session.id)}>Delete</button>}</div></article>)}</div>}
    </section>
    {loaded && <Planner key={generation} mode="personal" initialSession={initial} remembered={useMemory ? memory : undefined} onSaved={onSaved} onDirtyChange={setDirty} />}
  </>;
}
