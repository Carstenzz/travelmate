// utils/reverseGeocode.ts
// Helper untuk konversi koordinat ke nama lokasi (reverse geocoding) via Nominatim

export async function getLocationNameFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'travelmate-app' } });
    const data = await res.json();
    return data.display_name || '';
  } catch (e) {
    return '';
  }
}
