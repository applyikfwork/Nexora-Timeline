import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface Capsule {
  id: string;
  placeId: string;
  placeName: string;
  message: string;
  author: string;
  unlockYear: number;
  createdAt: string;
}

const CAPSULE_STORE: Capsule[] = [
  { id: "c1", placeId: "tokyo-jp", placeName: "Tokyo", message: "I hope the cherry blossoms are still as magical in 2030. I hope Shibuya crossing still stops your breath. I hope the ramen is still perfect at 2am.", author: "A traveler", unlockYear: 2030, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "c2", placeId: "delhi-in", placeName: "Delhi", message: "Dear Delhi 2030 — please still have your chaos. The world needs at least one city that refuses to be tamed. Keep the auto-rickshaws. Keep the street chaat. Keep the noise.", author: "Priya M.", unlockYear: 2030, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "c3", placeId: "new-york-us", placeName: "New York", message: "I'm writing this from a bodega at 3am. The city feels electric tonight. I hope in 2030 you still have bodegas and strangers who give you directions without being asked.", author: "Anonymous", unlockYear: 2030, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "c4", placeId: "paris-fr", placeName: "Paris", message: "To Paris 2030: please still argue about philosophy in cafes. Please still have bookshops on the Seine. You are proof that beauty can be stubborn.", author: "Jean-Luc", unlockYear: 2030, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: "c5", placeId: "mumbai-in", placeName: "Mumbai", message: "Mumbai 2030 — I hope you caught a break. I hope the monsoon is still magical and the dabbawalas still never miss a delivery. You're the most resilient city I've ever loved.", author: "Arjun K.", unlockYear: 2030, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "c6", placeId: "london-uk", placeName: "London", message: "London in 2030: I hope the pubs are still warmly lit and strangers still moan about the tube together. That's what makes you London.", author: "Sarah W.", unlockYear: 2030, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
];

let idCounter = 100;

router.get("/capsule", (req, res) => {
  const placeId = req.query.placeId as string | undefined;
  const capsules = placeId
    ? CAPSULE_STORE.filter(c => c.placeId === placeId)
    : CAPSULE_STORE;
  res.json(capsules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.post("/capsule", (req, res) => {
  const { placeId, placeName, message, author } = req.body as {
    placeId: string;
    placeName: string;
    message: string;
    author?: string;
  };

  if (!placeId || !message) {
    res.status(400).json({ error: "placeId and message required" });
    return;
  }

  const capsule: Capsule = {
    id: `c${++idCounter}`,
    placeId,
    placeName: placeName || placeId,
    message: message.slice(0, 500),
    author: author || "Anonymous",
    unlockYear: 2030,
    createdAt: new Date().toISOString(),
  };

  CAPSULE_STORE.push(capsule);
  res.status(201).json(capsule);
});

export default router;
