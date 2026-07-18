import { adminDb } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return await listReviews(req, res);
    if (req.method === "POST") return await addReview(req, res);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "خطأ غير متوقع" });
  }
}

async function listReviews(req, res) {
  const snap = await adminDb.collection("reviews").orderBy("createdAt", "desc").limit(100).get();
  const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return res.status(200).json({ reviews });
}

async function addReview(req, res) {
  const b = req.body || {};
  const name = String(b.name || "").trim().slice(0, 60);
  const text = String(b.text || "").trim().slice(0, 600);
  const stars = Math.min(5, Math.max(1, Number(b.stars) || 5));
  if (!name) return res.status(400).json({ error: "اكتب اسمك" });
  if (text.length < 10) return res.status(400).json({ error: "اكتب رأيك (10 أحرف على الأقل)" });
  const docRef = await adminDb.collection("reviews").add({
    name, text, stars, createdAt: new Date().toISOString(),
  });
  return res.status(201).json({ id: docRef.id });
}
