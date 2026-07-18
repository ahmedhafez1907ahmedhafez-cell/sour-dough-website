import { adminDb, requireAdmin, ApiError } from "../../../lib/firebaseAdmin";
import { getDeliveryFee, getGovernorateFee, OTHER_GOVERNORATE } from "../../../lib/deliveryRates";
import { sendOrderNotification } from "../../../lib/sendMail";
import { createJtShipment } from "../../../lib/jtExpress";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") return await createOrder(req, res);
    if (req.method === "GET") return await listOrders(req, res);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("/api/orders error:", e.code || "", e.message || e);
    const status = e instanceof ApiError ? e.status : 500;
    return res.status(status).json({ error: e.message || "خطأ غير متوقع" });
  }
}

// أي حد يقدر يعمل أوردر (عميل الموقع) — مفيش حاجة أدمن هنا
async function createOrder(req, res) {
  const b = req.body || {};
  const required = ["customerName", "customerPhone", "street", "zone", "items"];
  for (const f of required) {
    if (!b[f] || (Array.isArray(b[f]) && b[f].length === 0)) {
      return res.status(400).json({ error: `الحقل "${f}" مطلوب` });
    }
  }

  // منتجات زي الخبز والخميرة السائلة بتتوصل بنها بس — بنتأكد من ده في
  // السيرفر برضو (مش بس في الواجهة) عشان محدش يقدر يتحايل عليها.
  const hasLocalOnlyItem = b.items.some((i) => i.localOnly);
  if (hasLocalOnlyItem && b.zone !== "banha") {
    return res.status(400).json({ error: "في طلبك منتجات (خبز/خميرة سائلة) بتتوصل بنها بس" });
  }

  let deliveryFee = null;
  let deliveryNote = "";
  if (b.zone === "banha") {
    if (!b.area) return res.status(400).json({ error: "اختار منطقتك في بنها" });
    deliveryFee = getDeliveryFee(b.area);
  } else if (b.zone === "nationwide") {
    if (!b.province) return res.status(400).json({ error: "اختار المحافظة" });
    if (b.province === OTHER_GOVERNORATE) {
      deliveryFee = null;
      deliveryNote = "سعر التوصيل هنقولك عليه على رقم الهاتف اللي بعته";
    } else {
      deliveryFee = getGovernorateFee(b.province);
      if (deliveryFee === null) return res.status(400).json({ error: "محافظة غير معروفة" });
    }
  } else {
    return res.status(400).json({ error: "منطقة توصيل غير معروفة" });
  }

  const itemsTotal = b.items.reduce((s, i) => s + (i.totalPrice || 0), 0);
  const total = itemsTotal + (deliveryFee || 0);

  const orderRef = await adminDb.collection("orders").add({
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    zone: b.zone,
    province: b.province || "",
    area: b.area || "",
    street: b.street,
    building: b.building || "",
    floor: b.floor || "",
    flat: b.flat || "",
    items: b.items,
    itemsTotal,
    deliveryFee,
    deliveryNote,
    total,
    status: "قيد التحضير",
    jtWaybillNo: null,
    createdAt: new Date().toISOString(),
  });

  const order = { id: orderRef.id, ...b, deliveryFee, total };

  // إشعار إيميل — مايفشلش الطلب لو الإيميل وقع
  sendOrderNotification(order).catch((e) => console.error("[order email]", e));

  // شحنة J&T — لو مش مفعّل هترجع {enabled:false} من غير ما توقف الأوردر
  try {
    const jt = await createJtShipment(order);
    if (jt.enabled && jt.waybillNo) {
      await orderRef.update({ jtWaybillNo: jt.waybillNo });
    }
  } catch (e) {
    console.error("[J&T]", e.message);
  }

  return res.status(201).json({ id: orderRef.id, total, deliveryFee, deliveryNote });
}

// أدمن بس — كل الطلبات
async function listOrders(req, res) {
  await requireAdmin(req);
  const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(200).get();
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return res.status(200).json({ orders });
}
