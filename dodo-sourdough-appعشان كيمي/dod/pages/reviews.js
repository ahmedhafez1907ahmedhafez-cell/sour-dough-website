import { useEffect, useState } from "react";
import { useCardReveal } from "../lib/useMotion";
import { useShop } from "../context/ShopContext";

export default function Reviews() {
  const shop = useShop();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/reviews").then((r) => r.json()).then((d) => setReviews(d.reviews || [])).finally(() => setLoading(false));
  }
  useEffect(load, []);
  useCardReveal([reviews, loading]);

  async function submit() {
    if (!name.trim()) return shop.showToast("⚠️ اكتب اسمك!");
    if (text.trim().length < 10) return shop.showToast("⚠️ اكتب رأيك (10 أحرف على الأقل)!");
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text, stars }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setModalOpen(false);
      setName(""); setText(""); setStars(5);
      shop.showToast("🎉 شكراً على تعليقك! تم النشر");
      load();
    } catch (e) {
      shop.showToast("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reviews-page">
      <div className="section-title"><span className="eyebrow">Testimonials</span><h2>آراء عملاءنا 💬</h2><div className="title-line"></div><p>كلام حقيقي من ناس جربوا دودو ساوردو</p></div>

      <div className="reviews-grid">
        {loading && <p style={{ textAlign: "center", color: "#aaa" }}>جاري التحميل...</p>}
        {!loading && !reviews.length && <p style={{ textAlign: "center", color: "#aaa" }}>لسه مفيش تعليقات، كن أول واحد يكتب!</p>}
        {reviews.map((rev, i) => (
          <div className="review-card reveal" style={{ transitionDelay: Math.min(i * 0.06, 0.4) + "s" }} key={rev.id}>
            <div className="review-quote">&rdquo;</div>
            <p className="review-text">{rev.text}</p>
            <div className="review-author">
              <div className="review-avatar">{(rev.name || "?").charAt(0)}</div>
              <div>
                <div className="review-name">{rev.name}</div>
                <div className="review-stars">{"⭐".repeat(rev.stars || 5)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="write-review-btn" onClick={() => setModalOpen(true)}>✍️ اكتب تعليقك</button>

      {modalOpen && (
        <div className="review-modal open" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="review-modal-inner">
            <button className="review-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <div className="review-modal-content">
              <h3>✍️ شاركنا رأيك</h3>
              <div className="review-form-group"><label>👤 اسمك *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" /></div>
              <div className="review-form-group">
                <label>⭐ تقييمك</label>
                <div className="star-select">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= stars ? "active" : ""} onClick={() => setStars(n)}>⭐</span>
                  ))}
                </div>
              </div>
              <div className="review-form-group"><label>💬 رأيك *</label><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب تجربتك مع دودو ساوردو..." /></div>
              <button className="submit-review-btn" disabled={busy} onClick={submit}>{busy ? "جاري الإرسال..." : "🍞 أرسل تعليقك"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
