import { useState, useEffect } from "react";

const CITY_MAP: { id: string; name: string; lat: number; lng: number; country: string }[] = [
  { id: "delhi-in", name: "Delhi", lat: 28.6139, lng: 77.209, country: "India" },
  { id: "mumbai-in", name: "Mumbai", lat: 19.076, lng: 72.8777, country: "India" },
  { id: "bangalore-in", name: "Bangalore", lat: 12.9716, lng: 77.5946, country: "India" },
  { id: "london-uk", name: "London", lat: 51.5074, lng: -0.1278, country: "UK" },
  { id: "new-york-us", name: "New York", lat: 40.7128, lng: -74.006, country: "USA" },
  { id: "tokyo-jp", name: "Tokyo", lat: 35.6762, lng: 139.6503, country: "Japan" },
  { id: "paris-fr", name: "Paris", lat: 48.8566, lng: 2.3522, country: "France" },
  { id: "dubai-ae", name: "Dubai", lat: 25.2048, lng: 55.2708, country: "UAE" },
  { id: "singapore-sg", name: "Singapore", lat: 1.3521, lng: 103.8198, country: "Singapore" },
  { id: "sydney-au", name: "Sydney", lat: -33.8688, lng: 151.2093, country: "Australia" },
  { id: "cairo-eg", name: "Cairo", lat: 30.0444, lng: 31.2357, country: "Egypt" },
  { id: "seoul-kr", name: "Seoul", lat: 37.5665, lng: 126.978, country: "South Korea" },
  { id: "berlin-de", name: "Berlin", lat: 52.52, lng: 13.405, country: "Germany" },
  { id: "toronto-ca", name: "Toronto", lat: 43.6532, lng: -79.3832, country: "Canada" },
  { id: "sao-paulo-br", name: "São Paulo", lat: -23.5505, lng: -46.6333, country: "Brazil" },
];

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCity(lat: number, lng: number) {
  return CITY_MAP.reduce((nearest, city) => {
    const d = haversine(lat, lng, city.lat, city.lng);
    const nd = haversine(lat, lng, nearest.lat, nearest.lng);
    return d < nd ? city : nearest;
  });
}

export type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "granted"; lat: number; lng: number; city: typeof CITY_MAP[0] }
  | { status: "denied" }
  | { status: "unavailable" };

const GEO_CACHE_KEY = "nexora_geo_city";

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  useEffect(() => {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setState({ status: "granted", ...parsed });
        return;
      } catch {}
    }

    if (!navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }

    setState({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const city = findNearestCity(lat, lng);
        const result = { status: "granted" as const, lat, lng, city };
        setState(result);
        sessionStorage.setItem(
          GEO_CACHE_KEY,
          JSON.stringify({ lat, lng, city })
        );
      },
      () => {
        setState({ status: "denied" });
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  function retry() {
    sessionStorage.removeItem(GEO_CACHE_KEY);
    setState({ status: "idle" });
    setTimeout(() => {
      setState({ status: "loading" });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const city = findNearestCity(lat, lng);
          const result = { status: "granted" as const, lat, lng, city };
          setState(result);
          sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ lat, lng, city }));
        },
        () => setState({ status: "denied" }),
        { timeout: 8000 }
      );
    }, 100);
  }

  return { state, retry };
}
