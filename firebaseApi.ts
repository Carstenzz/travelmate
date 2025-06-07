// Firebase Firestore REST API config and basic CRUD functions

const FIREBASE_PROJECT_ID = 'travelmate-76ccd';
const FIREBASE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export async function addUser({ id, username, password }: { id: string; username: string; password: string }) {
  const url = `${FIREBASE_BASE_URL}/users?documentId=${id}`;
  const body = {
    fields: {
      id: { stringValue: id },
      username: { stringValue: username },
      password: { stringValue: password },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Helper: parse Firestore document fields to plain object
function parseUserDoc(doc: any) {
  const obj: any = { id: doc.name.split('/').pop() };
  for (const k in doc.fields) {
    const v = doc.fields[k];
    obj[k] = v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? null;
  }
  return obj;
}

// Check if user exists by username (hashed)
export async function checkUserExists(username: string) {
  const url = `${FIREBASE_BASE_URL}/users`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.documents) return false;
  return data.documents.map(parseUserDoc).some((u: any) => u.username === username);
}

// Insert user (username and password already hashed)
export async function insertUser(username: string, password_hash: string) {
  const url = `${FIREBASE_BASE_URL}/users`;
  const body = {
    fields: {
      username: { stringValue: username },
      password: { stringValue: password_hash },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Get user by username (hashed)
export async function getUserByUsername(username: string) {
  const url = `${FIREBASE_BASE_URL}/users`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.documents) return null;
  const users = data.documents.map(parseUserDoc).filter((u: any) => u.username === username);
  return users.length > 0 ? users[0] : null;
}

// Add similar functions for travel_note, travel_wishlist, chat, etc.

export { FIREBASE_BASE_URL };
