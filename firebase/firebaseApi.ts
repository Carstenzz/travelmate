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

// Add similar functions for travel_note, travel_wishlist, chat, etc.

export { FIREBASE_BASE_URL };
