"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { DEFAULT_POLICY, policySchema } from "../lib/contracts";
import type { Candidate, Kind, Policy, SessionItem } from "../lib/contracts";
import type { Anchor, PlanResponse } from "../lib/planner-contracts";
import { acceptCandidate, needsReview, orderSession } from "../lib/browser-state";
import { evaluateCandidatePolicy } from "../lib/policy";

const categoryName: Record<Kind, string> = { artist: "Music artists", film: "Films", tv: "TV shows" };
const presets: { name: string; query: string; kind: Kind }[] = [
  { name: "Frank Sinatra", query: "Frank Sinatra", kind: "artist" },
  { name: "The Sound of Music", query: "The Sound of Music", kind: "film" },
  { name: "I Love Lucy", query: "I Love Lucy", kind: "tv" },
  { name: "Lata Mangeshkar", query: "Lata Mangeshkar", kind: "artist" },
  { name: "Teresa Teng · 鄧麗君", query: "鄧麗君", kind: "artist" },
];
const distinct = (ids: string[]) => [...new Set(ids)].slice(0, 100);

async function post<T>(path: string, input: unknown): Promise<T> {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(25_000) });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "This request could not be completed.");
  return body as T;
}

export default function Planner() {
  const [query, setQuery] = useState("");
  const [searchKind, setSearchKind] = useState<Kind>("artist");
  const [matches, setMatches] = useState<Anchor[] | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [kinds, setKinds] = useState<Kind[]>(["artist", "film", "tv"]);
  const [policy, setPolicy] = useState<Policy>({ ...DEFAULT_POLICY });
  const [eraFrom, setEraFrom] = useState("");
  const [eraTo, setEraTo] = useState("");
  const [positiveIds, setPositive] = useState<string[]>([]);
  const [rejectedIds, setRejected] = useState<string[]>([]);
  const [skippedIds, setSkipped] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<SessionItem[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [previous, setPrevious] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState<"search" | "plan" | null>(null);
  const [message, setMessage] = useState("Search a cultural favourite, then confirm the exact match. Please leave out names, health details and care notes.");
  const [phase, setPhase] = useState<"building" | "active" | "finished">("building");
  const [reviewedAnchors, setReviewedAnchors] = useState<string[]>([]);
  const pending = useRef(false);

  async function search(event: FormEvent) {
    event.preventDefault(); if (pending.current) return;
    pending.current = true; setBusy("search"); setMatches(null); setMessage("Searching Qloo for the exact match…");
    try { const data = await post<{ results: Anchor[] }>("/api/search", { query, kind: searchKind }); setMatches(data.results); setMessage(data.results.length ? "Confirm the exact favourite below. Search results are not automatically added." : "No match in this category. Try another spelling, a native-language name, or a different favourite."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Search is unavailable. Try again."); }
    finally { pending.current = false; setBusy(null); }
  }

  function confirm(anchor: Anchor) {
    if (pending.current || phase !== "building" || anchors.length >= 6 || anchors.some((item) => item.id === anchor.id)) return;
    const confirmed = { ...anchor, ...(anchor.startingCandidate ? { startingCandidate: { ...anchor.startingCandidate, familiarity: "confirmed_favourite" as const } } : {}) };
    setAnchors([...anchors, confirmed]); setRejected(rejectedIds.filter((id) => id !== anchor.id)); setMatches(null); setQuery("");
    setMessage(`${anchor.name} is a confirmed favourite. Add another or explore possibilities.`);
  }

  async function refresh() {
    if (pending.current || !anchors.length || !kinds.length) return;
    if ((eraFrom && (!/^\d{4}$/.test(eraFrom) || +eraFrom < 1888 || +eraFrom > 2100)) || (eraTo && (!/^\d{4}$/.test(eraTo) || +eraTo < 1888 || +eraTo > 2100)) || (eraFrom && eraTo && +eraFrom > +eraTo)) { setMessage("Enter a valid film/TV era between 1888 and 2100, with the start before the end."); return; }
    pending.current = true; setBusy("plan"); setMessage("Finding Qloo possibilities, selecting a small set, and checking returned content notes…");
    const boundPolicy = { ...policy, ...(eraFrom || eraTo ? { screenEra: { ...(eraFrom ? { from: +eraFrom } : {}), ...(eraTo ? { to: +eraTo } : {}) } } : {}) };
    try {
      const data = await post<PlanResponse>("/api/plan", { kinds, state: { anchorIds: anchors.map((a) => a.id), positiveIds, rejectedIds, skippedIds, acceptedIds: accepted.map((item) => item.candidate.qlooEntityId), seenIds: plan?.candidates.map((c) => c.qlooEntityId) ?? [], policy: boundPolicy } });
      setPrevious(plan); setPlan(data); setSkipped([]);
      setNames((current) => ({ ...current, ...Object.fromEntries(data.candidates.map((candidate) => [candidate.qlooEntityId, candidate.name])) }));
      setMessage(data.candidates.length ? `${data.candidates.length} possibilities ready for your review. Your ${accepted.length} accepted activities remain in place.` : "No usable matches this time. Your accepted activities remain in place. Try a different favourite or category.");
    } catch (error) { setMessage((error instanceof Error ? error.message : "Discovery is unavailable.") + " Your accepted activities remain in place."); }
    finally { pending.current = false; setBusy(null); }
  }

  function add(candidate: Candidate) {
    const currentPolicy = policySchema.safeParse({ ...policy, ...(eraFrom || eraTo ? { screenEra: { ...(eraFrom ? { from: +eraFrom } : {}), ...(eraTo ? { to: +eraTo } : {}) } } : {}) });
    if (!currentPolicy.success) { setMessage("Check the film/TV era preferences before accepting this activity."); return; }
    const gate = evaluateCandidatePolicy(candidate, { anchorIds: anchors.map((anchor) => anchor.id), positiveIds, rejectedIds, skippedIds, acceptedIds: accepted.map((item) => item.candidate.qlooEntityId), seenIds: [], policy: currentPolicy.data });
    if (!gate.eligible) { setMessage("This item is held by the current rating or era preferences. Choose another activity or refresh discoveries."); return; }
    try { setAccepted(acceptCandidate(accepted, { ...candidate, familiarity: feedback[candidate.qlooEntityId] === "Known favourite" ? "confirmed_favourite" : candidate.familiarity })); setMessage(`${candidate.name} added. Acceptance keeps the session in place; it does not request new suggestions.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "This item cannot be accepted."); }
  }
  function reject(candidate: Candidate) {
    const id = candidate.qlooEntityId;
    if (rejectedIds.length >= 100 && !rejectedIds.includes(id)) { setMessage("The rejection limit for this tab has been reached. Finish your current session before starting a fresh tab."); return; }
    setRejected(distinct([...rejectedIds, id])); setPositive(positiveIds.filter((value) => value !== id)); setAccepted(accepted.filter((item) => item.candidate.qlooEntityId !== id));
    setFeedback({ ...feedback, [id]: "Not for them" }); setMessage(`${candidate.name} rejected. Refresh discoveries to send this exclusion to Qloo.`);
  }
  function known(candidate: Candidate) {
    if (positiveIds.length >= 12 && !positiveIds.includes(candidate.qlooEntityId)) { setMessage("You have reached the twelve additional favourite signals for this session."); return; }
    setPositive([...new Set([...positiveIds, candidate.qlooEntityId])]); setFeedback({ ...feedback, [candidate.qlooEntityId]: "Known favourite" });
    setAccepted(accepted.map((item) => item.candidate.qlooEntityId === candidate.qlooEntityId ? { ...item, candidate: { ...item.candidate, familiarity: "confirmed_favourite" } } : item));
    setMessage(`${candidate.name} marked as a known favourite. Refresh to use it as an additional Qloo signal.`);
  }
  function workedWell(candidate: Candidate) {
    if (positiveIds.length < 12 || positiveIds.includes(candidate.qlooEntityId)) setPositive([...new Set([...positiveIds, candidate.qlooEntityId])]);
    setFeedback({ ...feedback, [candidate.qlooEntityId]: "Worked well" });
    setMessage(`${candidate.name}: you observed that it worked well. This is separate from confirming a favourite.`);
  }

  const available = (plan?.candidates ?? []).filter((candidate) => !rejectedIds.includes(candidate.qlooEntityId) && !skippedIds.includes(candidate.qlooEntityId) && !accepted.some((item) => item.candidate.qlooEntityId === candidate.qlooEntityId));
  const ready = available.filter((candidate) => !needsReview(candidate));
  const review = available.filter(needsReview);

  function card(candidate: Candidate) {
    return <Discovery key={`${candidate.provenance.runId}:${candidate.qlooEntityId}`} candidate={candidate} busy={!!busy || phase !== "building"} full={accepted.length >= 3} feedback={feedback[candidate.qlooEntityId]} previous={previous?.candidates.find((c) => c.qlooEntityId === candidate.qlooEntityId)} previousQlooRank={previous?.trace.sourceRanks[candidate.qlooEntityId]} onAccept={() => add(candidate)} onKnown={() => known(candidate)} onReject={() => reject(candidate)} onSkip={() => { setSkipped(distinct([...skippedIds, candidate.qlooEntityId])); setMessage(`${candidate.name} skipped for the next refresh only.`); }} />;
  }

  return <div className="planner" id="planner">
    <div className="planner-intro"><p className="eyebrow">A few familiar starting points</p><h2>Make a little time together.</h2><p>Choose favourites, review possibilities, and keep two or three activities. Everything stays in this browser tab; refreshing the page clears it.</p></div>
    <p role="status" aria-live="polite" className="status-message">{message}</p>
    <div className="planner-layout">
      <div className="workspace">
        <section className="panel setup-panel" aria-labelledby="favourites-title">
          <p className="eyebrow">01 · Begin with what they enjoy</p><h3 id="favourites-title">Confirm a favourite</h3>
          <form onSubmit={search} className="search-form">
            <label>Category<select value={searchKind} disabled={!!busy || phase !== "building"} onChange={(event) => { setSearchKind(event.target.value as Kind); setMatches(null); }}>{Object.entries(categoryName).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="search-input">Artist, film or show<input value={query} onChange={(event) => { setQuery(event.target.value); setMatches(null); }} minLength={2} maxLength={100} placeholder="For example, Frank Sinatra" disabled={!!busy || phase !== "building"} required /></label>
            <button className="primary-button" type="submit" disabled={!!busy || phase !== "building" || anchors.length >= 6}>{busy === "search" ? "Searching…" : "Find match"}</button>
          </form>
          <div className="presets"><span>Try a starting point:</span>{presets.map((preset) => <button type="button" key={preset.query} disabled={!!busy || phase !== "building"} onClick={() => { setQuery(preset.query); setSearchKind(preset.kind); setMatches(null); }}>{preset.name}</button>)}</div>
          {matches && matches.length > 0 && <ul className="search-results">{matches.map((match) => <li key={match.id}><div><strong>{match.name}</strong><small>{categoryName[match.kind]}{match.year ? ` · ${match.year}` : ""}</small><p>{match.blurb.slice(0, 200)}</p></div><button type="button" disabled={anchors.length >= 6 || anchors.some((a) => a.id === match.id)} onClick={() => confirm(match)}>{anchors.some((a) => a.id === match.id) ? "Confirmed" : "Confirm favourite"}</button></li>)}</ul>}
          <div className="anchors" aria-label="Confirmed favourites">{anchors.map((anchor) => <span key={anchor.id} className="anchor-chip">{anchor.name}<button type="button" aria-label={`Remove favourite ${anchor.name}`} disabled={!!busy || phase !== "building"} onClick={() => setAnchors(anchors.filter((item) => item.id !== anchor.id))}>×</button></span>)}</div>
          {anchors.filter((anchor) => anchor.startingCandidate && !accepted.some((item) => item.candidate.qlooEntityId === anchor.id)).map((anchor) => <details className="favourite-start" key={anchor.id}><summary>Start with {anchor.name}</summary><p className="small-note">Your confirmed favourite, from Qloo search. This has no recommendation ranking or automated content screen. Film/TV rating and era preferences still apply.</p><p className="small-note">{anchor.blurb || "No description returned."}</p><label className="review-confirmation"><input type="checkbox" checked={reviewedAnchors.includes(anchor.id)} disabled={!!busy || phase !== "building"} onChange={(e) => setReviewedAnchors(e.target.checked ? [...reviewedAnchors, anchor.id] : reviewedAnchors.filter((id) => id !== anchor.id))} />I have reviewed this favourite and want to include it.</label><button type="button" disabled={!!busy || phase !== "building" || accepted.length >= 3 || !reviewedAnchors.includes(anchor.id)} onClick={() => add(anchor.startingCandidate!)}>Accept favourite activity</button></details>)}
          <details className="preferences"><summary>Discovery preferences</summary><fieldset disabled={!!busy || phase !== "building"}><legend>Explore related</legend><div className="check-row">{(Object.keys(categoryName) as Kind[]).map((kind) => <label key={kind}><input type="checkbox" checked={kinds.includes(kind)} onChange={(event) => setKinds(event.target.checked ? [...kinds, kind] : kinds.filter((k) => k !== kind))} />{categoryName[kind]}</label>)}</div><div className="preference-grid"><label>Film ratings<select value={policy.movieRatings} onChange={(e) => setPolicy({ ...policy, movieRatings: e.target.value as Policy["movieRatings"] })}><option value="G_PG">G and PG</option><option value="G">G only</option></select></label><label>TV ratings<select value={policy.tvRatings} onChange={(e) => setPolicy({ ...policy, tvRatings: e.target.value as Policy["tvRatings"] })}><option value="TV_G_PG">TV-G and TV-PG</option><option value="TV_G">TV-G only</option></select></label><label>Film / TV from<input inputMode="numeric" maxLength={4} value={eraFrom} placeholder="Any year" onChange={(e) => setEraFrom(e.target.value)} /></label><label>Film / TV to<input inputMode="numeric" maxLength={4} value={eraTo} placeholder="Any year" onChange={(e) => setEraTo(e.target.value)} /></label></div><p className="small-note">Unknown ratings are held. Music suggestions are artist-level; era and content ratings do not apply. Ratings do not establish suitability.</p></fieldset></details>
          <button className="primary-button explore-button" type="button" onClick={refresh} disabled={!!busy || !anchors.length || !kinds.length || phase !== "building"}>{busy === "plan" ? "Preparing possibilities…" : plan ? "Refresh discoveries" : "Explore possibilities"}<span aria-hidden="true">↗</span></button>
          {(rejectedIds.length > 0 || positiveIds.length > 0) && <div className="feedback-summary"><strong>Your feedback for the next discovery</strong>{rejectedIds.length > 0 && <p>Excluded: {rejectedIds.map((id) => names[id] || "Rejected discovery").join(", ")}.</p>}{positiveIds.length > 0 && <p>Additional taste signals: {positiveIds.map((id) => names[id] || "Confirmed favourite").join(", ")}.</p>}<p className="small-note">These changes are sent when you refresh. Accepted activities stay in place.</p></div>}
        </section>
        {plan && <section aria-labelledby="possibilities-title" className="discoveries">
          <div className="section-heading"><p className="eyebrow">02 · Possibilities, with evidence</p><h3 id="possibilities-title">A few things to consider</h3><p className="small-note">Qloo finds cultural connections across groups. These are possibilities, not predictions about this person. Every item needs your acceptance.</p></div>
          {plan.notices.map((notice) => <p className="notice" key={notice}>{notice}</p>)}
          {previous && <div className="change-summary"><strong>What changed on refresh</strong><p>Qloo excluded {plan.trace.exclusions.filter((id) => rejectedIds.includes(id)).length} rejected {plan.trace.exclusions.filter((id) => rejectedIds.includes(id)).length === 1 ? "item" : "items"}. {accepted.length} accepted activities stayed in your session.</p><p>{plan.candidates.filter((c) => previous.trace.sourceRanks[c.qlooEntityId] !== undefined && previous.trace.sourceRanks[c.qlooEntityId] !== c.provenance.qlooRank).length} displayed items changed their Qloo category rank. {plan.candidates.filter((c) => previous.trace.selectedOrder.includes(c.qlooEntityId) && previous.trace.selectedOrder.indexOf(c.qlooEntityId) !== plan.trace.selectedOrder.indexOf(c.qlooEntityId)).length} changed their selected position.</p><p className="small-note">Before/after observations from this tab, not proof that a particular feedback item caused a rank change.</p></div>}
          {ready.length > 0 && <div className="candidate-list">{ready.map(card)}</div>}
          {review.length > 0 && <div className="review-group"><h4>Needs your review <span>({review.length})</span></h4><p className="small-note">Flagged, incomplete or rating-held results. Review the returned source, follow the person’s lead, and pass on anything uncertain.</p><div className="candidate-list">{review.map(card)}</div></div>}
          {!available.length && <p className="empty-state">No remaining discoveries in this set. Your accepted activities are kept alongside. Refresh for more possibilities.</p>}
          <details className="trace"><summary>See this run’s evidence and limits</summary><p>{plan.mode === "agent" ? "Gemini selected within this run’s Qloo pool." : "Fallback interleaved Qloo source order by category."} {plan.trace.qlooCalls}/6 Qloo requests · {plan.trace.modelRounds}/3 agent rounds · {plan.trace.screenCalls}/1 content screen · {(plan.trace.elapsedMs / 1000).toFixed(1)} seconds.</p><p>Qloo rank is within its category; selected position is presentation order. Neither is a probability of enjoyment. Changes in model selection are separate from changes in Qloo ordering.</p><details><summary>Signals and exclusions sent in this run</summary><pre>{JSON.stringify({ signals: plan.trace.signals, exclusions: plan.trace.exclusions, requests: plan.trace.requests }, null, 2)}</pre></details></details>
        </section>}
      </div>
      <aside className={`session-panel panel ${phase !== "building" ? "session-open" : ""}`} aria-labelledby="session-title">
        <p className="eyebrow">03 · Your accepted activities</p><h3 id="session-title">A little session, your way.</h3><p className="small-note">{accepted.length}/3 activities · {accepted.reduce((sum, item) => sum + item.suggestedMinutes, 0)} minutes of activity time. This is your time together, not the full media runtime.</p>
        {!accepted.length && <p className="empty-state">Accepted activities will stay here while discoveries change. Choose two or three for a session.</p>}
        <ol className="session-list">{accepted.map((item, index) => <li key={item.candidate.qlooEntityId}><span className="step-number">{String(index + 1).padStart(2, "0")}</span><h4>{item.candidate.name}</h4><p className="small-note">Explicitly accepted by you · {categoryName[item.candidate.kind]}</p>
          {item.candidate.screening.flags.length > 0 && <p className="notice">Content notes: {item.candidate.screening.flags.map((flag) => flag.note).join(" ")}</p>}
          {item.candidate.screening.status !== "complete" && <p className="small-note">Accepted after your review. Automated content screening is incomplete.</p>}
          {phase === "building" ? <><div className="preference-grid"><label>Activity<select value={item.activity} onChange={(e) => setAccepted(accepted.map((row, i) => i === index ? { ...row, activity: e.target.value as SessionItem["activity"] } : row))}><option value="listen">Listen</option><option value="view">View</option><option value="talk">Talk</option></select></label><label>Minutes<input type="number" min={1} max={20} value={item.suggestedMinutes} onChange={(e) => { const minutes = +e.target.value; if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 20) setAccepted(accepted.map((row, i) => i === index ? { ...row, suggestedMinutes: minutes } : row)); }} /></label></div><div className="button-row"><button disabled={!!busy || index === 0} aria-label={`Move ${item.candidate.name} earlier`} onClick={() => setAccepted(orderSession(accepted, index, -1))}>↑</button><button disabled={!!busy || index === accepted.length - 1} aria-label={`Move ${item.candidate.name} later`} onClick={() => setAccepted(orderSession(accepted, index, 1))}>↓</button><button disabled={!!busy} onClick={() => setAccepted(accepted.filter((_, i) => i !== index))}>Remove</button></div></> : <><p><strong>{item.activity} · {item.suggestedMinutes} minutes</strong></p><p className="conversation-prompt">{item.prompt}</p><MediaLink candidate={item.candidate} /><div className="button-row no-print"><button disabled={!!busy} onClick={() => { workedWell(item.candidate); }}>Worked well</button><button onClick={() => reject(item.candidate)}>Not for them</button></div><p className="small-note">{feedback[item.candidate.qlooEntityId]}</p></>}
        </li>)}</ol>
        {phase === "building" && <button className="primary-button" disabled={accepted.length < 2 || !!busy} onClick={() => { setPhase("active"); setMessage("Your session is ready. Take it at the person’s pace; passing or stopping is always fine."); }}>Start this session</button>}
        {phase === "active" && <button className="primary-button no-print" onClick={() => { setPhase("finished"); setMessage("Session finished. Your activities and observations remain here until you refresh the page."); }}>Finish session</button>}
        {phase === "finished" && <p className="notice">Session finished. Keep what worked, and follow their lead next time.</p>}
        {phase !== "building" && <div className="button-row no-print"><button onClick={() => setPhase("building")}>Back to planning</button><button onClick={() => window.print()}>Print session</button></div>}
        <p className="small-note">An activity aid, not therapy. A content check can miss things; you have the final say. Stop or switch whenever the person wishes.</p>
      </aside>
    </div>
  </div>;
}

function Discovery({ candidate: c, busy, full, feedback, previous, previousQlooRank, onAccept, onKnown, onReject, onSkip }: { candidate: Candidate; busy: boolean; full: boolean; feedback?: string; previous?: Candidate; previousQlooRank?: number; onAccept: () => void; onKnown: () => void; onReject: () => void; onSkip: () => void }) {
  const [reviewed, setReviewed] = useState(false);
  const extraReview = needsReview(c);
  return <article className={`candidate-card ${extraReview ? "review-card" : ""}`}>
    <div className="card-top"><span className="category-label">{categoryName[c.kind]}{c.year ? ` · ${c.year}` : ""}</span><span className="rating-label">{c.kind === "artist" ? "Artist-level" : c.contentRating || "Rating unknown"}</span></div>
    <h4>{c.name}</h4><p className="blurb">{c.blurb || "Qloo did not return a description. Please check a source before choosing this activity."}</p>
    <div className="evidence"><strong>Connected to your favourites</strong>{c.provenance.explainability === "available" ? <ul>{c.provenance.attribution.map((a) => <li key={a.signalEntityId}>{a.signalName}</li>)}</ul> : <p>Qloo did not provide usable input attribution for this item.</p>}<small>Qloo’s group-level taste connection; it does not explain an individual preference.</small><details><summary>Qloo source details</summary><p>Request {c.provenance.requestId}</p>{c.provenance.attribution.map((a) => <p key={a.signalEntityId}>{a.signalName} · {a.signalEntityId}{a.contribution !== undefined ? ` · input influence ${a.contribution.toFixed(3)}` : " · influence not returned"}</p>)}</details></div>
    <p className="rank-note">Qloo rank #{c.provenance.qlooRank} in {categoryName[c.kind].toLowerCase()} · Selected position #{c.provenance.selectedRank}{previousQlooRank !== undefined ? ` · Previous Qloo #${previousQlooRank}` : ""}{previous ? ` · Previous selected #${previous.provenance.selectedRank}` : ""}</p>
    {c.ratingGate === "held" && <p className="notice">Rating held. This item cannot enter this session. Choose another discovery.</p>}
    <details className="content-notes" open={c.screening.flags.length > 0}><summary>Content check · {c.screening.status === "complete" ? c.screening.flags.length ? `${c.screening.flags.length} advisory notes` : "no flags in returned metadata" : c.screening.status.replaceAll("_", " ")}</summary><p className="small-note">An advisory check of Qloo metadata. It can miss content; it does not establish suitability.</p>{c.screening.note && <p>{c.screening.note}</p>}{c.screening.flags.map((flag, index) => <div className="content-flag" key={index}><strong>{flag.code}: {flag.note}</strong><blockquote>“{flag.evidence}”</blockquote><small>Qloo field: {flag.fieldPath}</small></div>)}</details>
    <MediaLink candidate={c} />
    {extraReview && c.ratingGate === "eligible" && <label className="review-confirmation"><input type="checkbox" checked={reviewed} disabled={busy} onChange={(event) => setReviewed(event.target.checked)} />I have reviewed the content and incomplete checks, and want to include this.</label>}
    <div className="button-row"><button className="accept-button" disabled={busy || full || c.ratingGate === "held" || (extraReview && !reviewed)} onClick={onAccept}>Accept activity</button><button disabled={busy || !!feedback} onClick={onKnown}>{feedback || "Known favourite"}</button><button disabled={busy} onClick={onReject}>Not for them</button><button disabled={busy} onClick={onSkip}>Skip</button></div>
    <p className="small-note">Accept adds to your session. Known favourite adds a taste signal on refresh. Not for them excludes; Skip lasts one refresh.</p>
  </article>;
}

function MediaLink({ candidate }: { candidate: Candidate }) {
  const [loaded, setLoaded] = useState(false);
  return <div className="media-links">{candidate.playbackUrl && <a href={candidate.playbackUrl} target="_blank" rel="noopener noreferrer">Search YouTube <span aria-hidden="true">↗</span></a>}{candidate.spotifyArtistId && <><button className="text-button no-print" type="button" onClick={() => setLoaded(!loaded)}>{loaded ? "Close Spotify" : "Load Spotify preview"}</button>{loaded && <iframe title={`${candidate.name} on Spotify`} src={`https://open.spotify.com/embed/artist/${candidate.spotifyArtistId}`} width="100%" height="152" loading="lazy" allow="encrypted-media; fullscreen; picture-in-picture" />}</>}<small>External media availability varies. You choose whether to play.</small></div>;
}

