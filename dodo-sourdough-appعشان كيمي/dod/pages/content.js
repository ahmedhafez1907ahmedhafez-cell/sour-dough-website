import { useEffect, useMemo, useState } from "react";
import { useCardReveal, scatterStyle } from "../lib/useMotion";

const PLATFORMS = [
  { key: "instagram", label: "📸 انستجرام", color: "#dc2743" },
  { key: "tiktok", label: "🎵 تيك توك", color: "#111" },
  { key: "facebook", label: "📘 فيسبوك", color: "#1877F2" },
  { key: "youtube", label: "▶️ يوتيوب", color: "#FF0000" },
];

// عناوين صفحاتنا (نفس اللي في القائمة الجانبية) — تستخدم كـ "شوف كل حاجة على..."
const PROFILE_LINKS = {
  instagram: "https://www.instagram.com/dodosourdogh",
  tiktok: "https://www.tiktok.com/@dodo.sourdough",
  facebook: "https://www.facebook.com/profile.php?id=61574499401410",
  youtube: "https://www.youtube.com/@DodoSourdough/videos",
};

function getYoutubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2];
    else id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

// بيحمّل سكريبت embed خارجي مرة واحدة بس (رسمي من كل منصة، مفيش أي API key)
function useEmbedScript(src, globalCheck) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (globalCheck()) {
      globalCheck()?.process?.(); // لو محمّل قبل كده، أعد المعالجة بس
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }, [src]); // eslint-disable-line
}

export default function Content() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("instagram");

  useEffect(() => {
    fetch("/api/content").then((r) => r.json()).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => items.filter((i) => i.platform === platform), [items, platform]);
  useCardReveal([list, loading, platform]);

  useEmbedScript("https://www.instagram.com/embed.js", () => typeof window !== "undefined" && window.instgrm);
  useEmbedScript("https://www.tiktok.com/embed.js", () => null); // تيك توك بيعيد المعالجة لوحده كل ما الـ blockquote يتضاف
  useEmbedScript("https://connect.facebook.net/ar_AR/sdk.js#xfbml=1&version=v19.0", () => typeof window !== "undefined" && window.FB);

  useEffect(() => {
    // إعادة معالجة الـ embeds بعد ما القائمة تتغيّر (تبديل تاب مثلاً)
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      window.instgrm?.Embeds?.process?.();
      window.FB?.XFBML?.parse?.();
    }, 300);
    return () => clearTimeout(t);
  }, [list]);

  return (
    <div className="gallery-page">
      <div className="section-title">
        <span className="eyebrow">Content</span>
        <h2>المحتوى 📱</h2>
        <div className="title-line"></div>
        <p>آخر منشوراتنا من كل صفحاتنا في مكان واحد</p>
      </div>

      <div className="filter-section" style={{ background: "transparent", border: "none" }}>
        {PLATFORMS.map((p) => (
          <button key={p.key} className={"filter-btn" + (platform === p.key ? " active" : "")} onClick={() => setPlatform(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="gallery-page-wrap" style={{ maxWidth: 640 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <a href={PROFILE_LINKS[platform]} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: "inline-flex" }}>
            شوف كل حاجة على {PLATFORMS.find((p) => p.key === platform)?.label} ↗
          </a>
        </div>

        {loading && <p style={{ color: "#ccc", textAlign: "center" }}>جاري التحميل...</p>}
        {!loading && !list.length && (
          <p style={{ color: "rgba(245,240,232,0.7)", textAlign: "center" }}>لسه مفيش منشورات مضافة من الصفحة دي.</p>
        )}

        <div style={{ display: "grid", gap: 24 }}>
          {list.map((it, idx) => (
            <div key={it.id} className="reveal" style={{ transitionDelay: Math.min(idx * 0.08, 0.5) + "s", background: "#fff", borderRadius: 16, overflow: "hidden", padding: platform === "youtube" ? 0 : 8 }}>
              {it.caption && <p style={{ padding: "10px 14px 0", fontSize: 13, color: "#555" }}>{it.caption}</p>}
              <EmbedCard platform={it.platform} url={it.url} />
              <div style={{ padding: "10px 14px" }}>
                <a href={it.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>
                  ❤️ لايك / كومنت على المنشور الأصلي ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmbedCard({ platform, url }) {
  if (platform === "youtube") {
    const embedUrl = getYoutubeEmbedUrl(url);
    if (!embedUrl) return <p style={{ padding: 14, fontSize: 13 }}>رابط يوتيوب مش مفهوم</p>;
    return (
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
        <iframe
          src={embedUrl}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (platform === "instagram") {
    return (
      <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14" style={{ margin: "0 auto", maxWidth: 540, width: "100%" }}>
        <a href={url} target="_blank" rel="noreferrer">عرض المنشور على انستجرام</a>
      </blockquote>
    );
  }
  if (platform === "tiktok") {
    const idMatch = url.match(/\/video\/(\d+)/);
    return (
      <blockquote className="tiktok-embed" cite={url} data-video-id={idMatch ? idMatch[1] : ""} style={{ margin: "0 auto", maxWidth: 605, width: "100%" }}>
        <a href={url} target="_blank" rel="noreferrer">عرض الفيديو على تيك توك</a>
      </blockquote>
    );
  }
  if (platform === "facebook") {
    return (
      <div className="fb-post" data-href={url} data-width="500" style={{ margin: "0 auto" }}>
        <a href={url} target="_blank" rel="noreferrer">عرض المنشور على فيسبوك</a>
      </div>
    );
  }
  return null;
}
