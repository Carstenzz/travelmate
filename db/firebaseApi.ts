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
function parseDoc(doc: any) {
  const obj: any = { id: doc.name.split('/').pop() };
  for (const k in doc.fields) {
    const v = doc.fields[k];
    obj[k] = v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? null;
  }
  return obj;
}

// Get all travel notes for a user
export async function getTravelNotesByUser(user_id: string) {
  const url = `${FIREBASE_BASE_URL}/travel_note`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents
    .map(parseDoc)
    .filter((n: any) => n.user_id === user_id);
}

// Add travel note
export async function addTravelNote(note: {
  user_id: string;
  title: string;
  description: string;
  photo_url?: string;
  location?: string;
  coordinate?: string;
}) {
  const url = `${FIREBASE_BASE_URL}/travel_note`;
  const body = {
    fields: {
      user_id: { stringValue: note.user_id },
      title: { stringValue: note.title },
      description: { stringValue: note.description },
      photo_url: { stringValue: note.photo_url || '' },
      location: { stringValue: note.location || '' },
      coordinate: { stringValue: note.coordinate || '' },
    },
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

// Get all wishlist for a user
export async function getWishlistByUser(user_id: string) {
  const url = `${FIREBASE_BASE_URL}/travel_wishlist`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents
    .map(parseDoc)
    .filter((n: any) => n.user_id === user_id);
}

// Add wishlist
export async function addWishlist(wish: {
  user_id: string;
  place_name: string;
  location?: string;
  coordinate?: string;
}) {
  const url = `${FIREBASE_BASE_URL}/travel_wishlist`;
  const body = {
    fields: {
      user_id: { stringValue: wish.user_id },
      place_name: { stringValue: wish.place_name },
      location: { stringValue: wish.location || '' },
      coordinate: { stringValue: wish.coordinate || '' },
    },
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

// Get travel note by id
export async function getTravelNoteById(id: string) {
  const url = `${FIREBASE_BASE_URL}/travel_note/${id}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  return parseDoc(doc);
}

// Delete travel note by id
export async function deleteTravelNote(id: string) {
  const url = `${FIREBASE_BASE_URL}/travel_note/${id}`;
  return fetch(url, { method: 'DELETE' });
}

// Update travel note by id
export async function updateTravelNote(id: string, note: {
  title: string;
  description: string;
  photo_url?: string;
  location?: string;
  coordinate?: string;
}) {
  const url = `${FIREBASE_BASE_URL}/travel_note/${id}`;
  const body = {
    fields: {
      title: { stringValue: note.title },
      description: { stringValue: note.description },
      photo_url: { stringValue: note.photo_url || '' },
      location: { stringValue: note.location || '' },
      coordinate: { stringValue: note.coordinate || '' },
    },
  };
  return fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

// Get wishlist by id
export async function getWishlistById(id: string) {
  const url = `${FIREBASE_BASE_URL}/travel_wishlist/${id}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  return parseDoc(doc);
}

// Delete wishlist by id
export async function deleteWishlist(id: string) {
  const url = `${FIREBASE_BASE_URL}/travel_wishlist/${id}`;
  return fetch(url, { method: 'DELETE' });
}

// Update wishlist by id
export async function updateWishlist(id: string, wish: {
  place_name: string;
  location?: string;
  coordinate?: string;
}) {
  const url = `${FIREBASE_BASE_URL}/travel_wishlist/${id}`;
  const body = {
    fields: {
      place_name: { stringValue: wish.place_name },
      location: { stringValue: wish.location || '' },
      coordinate: { stringValue: wish.coordinate || '' },
    },
  };
  return fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

// ...add more CRUD as needed for chat, update, delete, etc...

export { FIREBASE_BASE_URL };
