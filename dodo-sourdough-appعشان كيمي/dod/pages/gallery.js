import { useEffect, useState } from "react";
import { useCardReveal, scatterStyle } from "../lib/useMotion";
import { useShop } from "../context/ShopContext";

export default function Gallery() {
  const shop = useShop();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reelIdx, setReelIdx] = useState(0);
  const [reelOpen, setReelOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products || [])).finally(() => setLoading(false));
  }, []);
  useCardReveal([products, loading]);

  const videoProducts = products.filter((p) => p.video);

  function openReel(i) { setReelIdx(i); setReelOpen(true); }

  return (
    <div className="gallery-page">
      <div className="section-title"><span className="eyebrow">Gallery</span><h2>من مطبخنا لسفرتك 📸</h2><div className="title-line"></div><p>صور وفيديوهات حقيقية من منتجاتنا</p></div>

      <div className="gallery-page-wrap">
        <div className="gallery-products-grid">
          {loading && <p style={{ color: "#ccc" }}>جاري التحميل...</p>}
          {products.filter((p) => p.mainImg).map((p, idx) => {
            const images = p.secondImg ? [p.mainImg, p.secondImg] : [p.mainImg];
            return (
              <div className="gallery-prod-card scatter-card" style={scatterStyle(idx)} key={p.id} onClick={() => shop.openLightbox(images, 0)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="gpc-img" src={p.mainImg} alt={p.nameAr} onError={(e) => (e.currentTarget.style.display = "none")} />
                <div className="gallery-prod-overlay">
                  <div className="gallery-prod-name">{p.nameAr}</div>
                </div>
              </div>
            );
          })}
        </div>

        {!!videoProducts.length && (
          <div className="reels-section">
            <div className="reels-section-title">🎬 شرح طريقة الخبز</div>
            <div className="reels-outer" onClick={() => openReel(0)}>
              <div className="reels-thumb-layer">
                {videoProducts.slice(0, 3).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div className={"reels-thumb-slot" + (i > 0 ? " dimmed" : "")} style={{ flex: i === 0 ? 10 : 10 * Math.pow(0.55, i) }} key={p.id}>
                    <img src={p.mainImg} alt={p.nameAr} />
                  </div>
                ))}
              </div>
              <div className="reels-outer-overlay">
                <div className="reels-outer-label">🎬 شرح طريقة الخبز 👌</div>
                <div className="reels-outer-bottom">
                  {videoProducts.length > 3 && <div className="reels-outer-count">+{videoProducts.length - 3} فيديو</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {reelOpen && (
        <div className="reels-modal open">
          <div className="reels-player-wrap">
            <video className="reel-video" src={videoProducts[reelIdx].video} autoPlay loop controls playsInline />
            <button className="reel-close" onClick={() => setReelOpen(false)}>✕</button>
            <div className="reel-caption">
              <div className="reel-caption-name">{videoProducts[reelIdx].nameAr}</div>
              <div className="reel-caption-tag">#dodosourdough</div>
            </div>
            {reelIdx > 0 && (
              <button className="reel-nav-btn reel-nav-up" onClick={() => setReelIdx((i) => i - 1)}>▲</button>
            )}
            {reelIdx < videoProducts.length - 1 && (
              <button className="reel-nav-btn reel-nav-down" onClick={() => setReelIdx((i) => i + 1)}>▼</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
