import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { Firestore } from "@google-cloud/firestore";
import { savedSessionIdSchema, savedSnapshotSchema, sessionTitle } from "./saved-session-contracts.ts";
import type { SavedSession, SavedSnapshot, SessionSummary } from "./saved-session-contracts.ts";
import { ServiceError } from "./qloo.ts";
import { deriveSessionMemory } from "./session-memory.ts";

let instance: Firestore | undefined;
function database() {
  if (!process.env.GOOGLE_CLOUD_PROJECT) throw new ServiceError("storage_unavailable", "Saved sessions are unavailable right now. Your open session is still here; please try saving again later.", 503);
  return instance ??= new Firestore({ projectId: process.env.GOOGLE_CLOUD_PROJECT, databaseId: process.env.FIRESTORE_DATABASE_ID || "(default)", preferRest: true, ignoreUndefinedProperties: true });
}
export function ownerDocumentId(userId: string) {
  if (!userId || userId.length > 200) throw new ServiceError("sign_in_required", "Please log in to continue.", 401);
  return createHash("sha256").update(userId).digest("hex");
}
function owner(userId: string) { return database().collection("caregiverWorkspaces").doc(ownerDocumentId(userId)); }
function document(userId: string, id: string) { return owner(userId).collection("sessions").doc(savedSessionIdSchema.parse(id)); }
const missing = () => new ServiceError("session_not_found", "This session is unavailable in your account. Choose one from My sessions.", 404);
function requireActiveWorkspace(deleted: unknown) {
  if (deleted === true) throw new ServiceError("account_deleted", "This account has been deleted. Please sign in with an active account.", 401);
}
function summary(session: SavedSession): SessionSummary {
  const { snapshot: _snapshot, ...value } = session;
  return value;
}
function record(id: string, snapshot: SavedSnapshot, revision: number): SavedSession {
  return { id, snapshot, title: sessionTitle(snapshot), updatedAt: new Date().toISOString(), revision, activityCount: snapshot.accepted.length, minutes: snapshot.accepted.reduce((sum, item) => sum + item.suggestedMinutes, 0), phase: snapshot.phase };
}
export async function readWorkspace(userId: string) {
  const rows = await owner(userId).collection("sessions").orderBy("updatedAt", "desc").limit(20).get();
  const sessions = rows.docs.map(row => row.data() as SavedSession);
  return { sessions: sessions.map(summary), memory: deriveSessionMemory(sessions) };
}
export async function getSession(userId: string, id: string) {
  const row = await document(userId, id).get();
  if (!row.exists) throw missing();
  const value = row.data() as SavedSession;
  return { ...value, snapshot: savedSnapshotSchema.parse(value.snapshot) };
}
export async function createSession(userId: string, input: SavedSnapshot) {
  const snapshot = savedSnapshotSchema.parse(input);
  const root = owner(userId);
  const id = randomUUID();
  const value = record(id, snapshot, 1);
  await database().runTransaction(async transaction => {
    const workspace = await transaction.get(root);
    requireActiveWorkspace(workspace.get("deleted"));
    const count = workspace.get("count") || 0;
    if (count >= 20) throw new ServiceError("session_limit", "Your account holds up to 20 sessions. Delete one you no longer need before saving a new session.", 409);
    transaction.create(root.collection("sessions").doc(id), value);
    transaction.set(root, { count: count + 1 });
  });
  return value;
}
export async function updateSession(userId: string, id: string, input: SavedSnapshot, revision: number) {
  const snapshot = savedSnapshotSchema.parse(input);
  const ref = document(userId, id);
  const root = owner(userId);
  const value = record(id, snapshot, revision + 1);
  await database().runTransaction(async transaction => {
    const [existing, workspace] = await transaction.getAll(ref, root);
    requireActiveWorkspace(workspace.get("deleted"));
    if (!existing.exists) throw missing();
    if (existing.get("revision") !== revision) throw new ServiceError("session_conflict", "This session changed on another device or tab. Reopen the saved version, or save your current work as a new session.", 409);
    transaction.set(ref, value);
  });
  return value;
}
export async function deleteSession(userId: string, id: string) {
  const root = owner(userId);
  const ref = document(userId, id);
  await database().runTransaction(async transaction => {
    const [row, workspace] = await transaction.getAll(ref, root);
    if (!row.exists) throw missing();
    transaction.delete(ref);
    transaction.set(root, { count: Math.max(0, (workspace.get("count") || 1) - 1) });
  });
}

// One transaction removes the account's bounded session collection and blocks
// in-flight/late saves. Duplicate webhook deliveries are safe to repeat.
export async function deleteAccountSessions(userId: string) {
  const root = owner(userId);
  await database().runTransaction(async transaction => {
    await transaction.get(root);
    const sessions = await transaction.get(root.collection("sessions"));
    for (const session of sessions.docs) transaction.delete(session.ref);
    // This minimal hashed namespace marker contains no session data or Clerk ID.
    transaction.set(root, { deleted: true, count: 0 });
  }, { maxAttempts: 3 });
}
