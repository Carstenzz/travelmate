// Firebase Firestore REST API config and basic CRUD functions

const FIREBASE_BASE_URL = process.env.FIREBASE_BASE_URL || '';

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
    .filter((n: any) => n.user_id === user_id)
    .sort((a: any, b: any) => Number(a.created_at || 0) - Number(b.created_at || 0));
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
  const created_at = Date.now().toString();
  const body = {
    fields: {
      created_at: { stringValue: created_at },
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
    .filter((n: any) => n.user_id === user_id)
    .sort((a: any, b: any) => Number(a.created_at || 0) - Number(b.created_at || 0));
}

// Add wishlist
export async function addWishlist(wish: {
  user_id: string;
  place_name: string;
  location?: string;
  coordinate?: string;
}) {
  const url = `${FIREBASE_BASE_URL}/travel_wishlist`;
  const created_at = Date.now().toString();
  const body = {
    fields: {
      created_at: { stringValue: created_at },
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
  user_id: string;
  title: string;
  description: string;
  photo_url?: string;
  location?: string;
  coordinate?: string;
  created_at?: string;
}) {
  const url = `${FIREBASE_BASE_URL}/travel_note/${id}`;
  // Pastikan created_at tetap ada pada update
  const body = {
    fields: {
      created_at: { stringValue: note.created_at || id },
      user_id: { stringValue: note.user_id },
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
  user_id: string;
  place_name: string;
  location?: string;
  coordinate?: string;
  created_at?: string;
}) {
  const url = `${FIREBASE_BASE_URL}/travel_wishlist/${id}`;
  // Pastikan created_at tetap ada pada update
  const body = {
    fields: {
      created_at: { stringValue: wish.created_at || id },
      user_id: { stringValue: wish.user_id },
      place_name: { stringValue: wish.place_name },
      location: { stringValue: wish.location || '' },
      coordinate: { stringValue: wish.coordinate || '' },
    },
  };
  return fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

// Add chat message to Firestore
export async function addChatMessage(msg: { user_id: string; role: string; text: string }) {
  const url = `${FIREBASE_BASE_URL}/chat`;
  // Generate numeric created_at using timestamp (for ordering)
  const created_at = Date.now().toString();
  const body = {
    fields: {
      created_at: { stringValue: created_at },
      user_id: { stringValue: msg.user_id },
      role: { stringValue: msg.role },
      text: { stringValue: msg.text },
    },
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
