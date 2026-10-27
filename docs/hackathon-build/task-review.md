# Workflow evidence and caregiver review protocol

## Evidence obtained so far

One developer-operated browser rehearsal exercised live app data. It is implementation verification, **not an independent proxy study, caregiver validation or evidence of clinical benefit**. The operator knew the implementation. There is no recorded task-time measurement or independent comprehension score.

| Task | Observed result |
| --- | --- |
| Resolve and confirm favourites | Sinatra, The Sound of Music and I Love Lucy confirmed through the live UI. All five presets also passed API resolution, including Lata Mangeshkar and 鄧麗君. |
| Explain a connection | Cards displayed Qloo-returned source entities. Influence is labelled as group-level input attribution; raw scores are in a drawer. No independent participant explanation was collected. |
| Reject and refresh | Dean Martin disappeared from new discoveries. Nat King Cole/Ella Fitzgerald stayed accepted and ordered. The panel separately reported upstream rank and selected-position changes. |
| Interpret a content flag | Exact metadata excerpts and field paths rendered for flagged items. It was possible to inspect the source; user comprehension and flag recall are unmeasured. |
| Finish a session | Two accepted discoveries completed start → observed Worked well → finish. Separately, two confirmed favourites required review before acceptance and completed the mouse-operated flow. |
| Phone/keyboard | Phone-width layout had no horizontal overflow; keyboard finish worked. A tall desktop sidebar issue was found, fixed with internal scrolling, and its finish button subsequently worked by mouse. This is not an accessibility audit. |
| Print/media | Actual print output and audible playback are unverified. |

The same developer-operated workflow was later rehearsed against public Cloud Run: a reviewed Sinatra starting activity plus Nat King Cole, positive/rejection feedback and reordering, stable refresh, activity/time edits and finish. Held TV-MA acceptance was disabled. One refresh used the labelled timeout fallback; one warm retry completed in agent mode. The Spotify preview rendered and emulated phone width fitted. These deployment checks still provide no independent participant comprehension, task-time or caregiver-benefit evidence. See `deployment.md`.

## Next participant task

Recruit available family caregivers, or explicitly label non-caregivers as proxy testers. Do not collect recipient identifiers, diagnoses or care notes. Use fictional cultural anchors and ask the participant to:

1. Prepare a two- or three-activity accepted session.
2. Explain why one related item appeared and what the evidence does/does not mean.
3. Reject an item, refresh, and explain which items changed versus which stayed accepted.
4. Inspect a flagged item, explain the limits of the metadata check and decide whether to include it.
5. Start and finish the session, recording an observation separately from familiarity.

Record participant role, task completion, elapsed planning time, help needed, mistakes and the participant's own explanation. Record the build and failures. Use a plain-LLM alternative with equivalent product controls when attributing benefit to Qloo. Do not turn implementation success into a usability percentage.

For the optional matched comparison, freeze prompts/constraints, one Qloo pool, identical final counts and blinded source labels. Separate artist/Spotify coverage from film/TV year/rating checks. Unknown or unresolved entities are not proven fictional. The original small model-judged comparison favoured the plain LLM in three cases, Qloo in one, with one tie; it is not a superiority claim or caregiver evidence.
