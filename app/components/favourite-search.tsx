"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Anchor } from "../../lib/planner-contracts";
import type { Kind } from "../../lib/contracts";
import { createEntityLookup } from "../../lib/entity-lookup";
import { EntityImage } from "./entity-image";

const categoryName: Record<Kind, string> = { artist: "Music artists", film: "Films", tv: "TV shows" };
const presets: { name: string; query: string; kind: Kind }[] = [
  { name: "Frank Sinatra", query: "Frank Sinatra", kind: "artist" },
  { name: "The Sound of Music", query: "The Sound of Music", kind: "film" },
  { name: "I Love Lucy", query: "I Love Lucy", kind: "tv" },
  { name: "Lata Mangeshkar", query: "Lata Mangeshkar", kind: "artist" },
  { name: "Teresa Teng · 鄧麗君", query: "鄧麗君", kind: "artist" },
];

export function FavouriteSearch({ endpoint, disabled, anchors, onConfirm }: { endpoint: string; disabled: boolean; anchors: Anchor[]; onConfirm: (anchor: Anchor) => void }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("artist");
  const [matches, setMatches] = useState<Anchor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [problem, setProblem] = useState("");
  const lookup = useMemo(() => createEntityLookup(endpoint), [endpoint]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resultId = useId();
  const hintId = useId();
  const run = useCallback(async (value: string, category: Kind) => {
    setLoading(true); setProblem("");
    try {
      const results = await lookup.run(value, category);
      if (results !== null) { setMatches(results); setLoading(false); }
    } catch (error) { setProblem(error instanceof Error ? error.message : "Search is unavailable. Try again."); setLoading(false); }
  }, [lookup]);
  useEffect(() => {
    lookup.cancel(); setMatches(null); setLoading(false); setProblem("");
    if (disabled || composing || query.trim().length < 2) return;
    timer.current = setTimeout(() => void run(query, kind), 500);
    return () => { clearTimeout(timer.current); lookup.cancel(); };
  }, [query, kind, disabled, composing, lookup, run]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled || composing || query.trim().length < 2) return;
    clearTimeout(timer.current); void run(query, kind);
  }
  function changeQuery(value: string) { if (value === query) return; lookup.cancel(); setQuery(value); setMatches(null); setLoading(false); }

  return <>
    <form onSubmit={submit} className="search-form">
      <label>Category<select value={kind} disabled={disabled} onChange={event => { lookup.cancel(); setKind(event.target.value as Kind); setMatches(null); }}>{Object.entries(categoryName).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="search-input">Artist, film or show<input value={query} onChange={event => changeQuery(event.target.value)} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} minLength={2} maxLength={100} placeholder="For example, Frank Sinatra" disabled={disabled} aria-describedby={hintId} aria-controls={resultId} required /></label>
      <button className="primary-button" type="submit" disabled={disabled || anchors.length >= 6}>{loading ? "Searching…" : "Find match"}</button>
    </form>
    <p id={hintId} className="small-note">Matches appear as you type. Confirm the exact artist, film or show before it becomes a favourite.</p>
    <div className="presets"><span>Try a starting point:</span>{presets.map(preset => <button type="button" key={preset.query} disabled={disabled} onClick={() => { changeQuery(preset.query); setKind(preset.kind); }}>{preset.name}</button>)}</div>
    <p className="search-status small-note" role="status">{problem || (loading ? "Searching Qloo for matching favourites…" : matches ? matches.length ? "Choose the exact match below. Nothing is added automatically." : "No match in this category. Try another spelling, a native-language name, or a different favourite." : "")}</p>
    <ul className="search-results" id={resultId} aria-busy={loading}>{matches?.map(match => <li key={match.id}><div className="search-match"><EntityImage src={match.startingCandidate?.imageUrl} kind={match.kind} /><div className="result-copy"><strong>{match.name}</strong><small>{categoryName[match.kind]}{match.year ? ` · ${match.year}` : ""}</small><p>{match.blurb.slice(0, 200)}</p></div></div><button type="button" disabled={disabled || loading || anchors.length >= 6 || anchors.some(anchor => anchor.id === match.id)} onClick={() => { onConfirm(match); changeQuery(""); }}>{anchors.some(anchor => anchor.id === match.id) ? "Confirmed" : "Confirm favourite"}</button></li>)}</ul>
  </>;
}
