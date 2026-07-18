// ============================================================
// تكامل J&T Express — ⚠️ متوقف حالياً (JT_ENABLED=false في .env)
// ============================================================
// السبب: محتاج منك تتواصل مع J&T Express مصر وتطلب "Open API access"
// (مختلفة عن حساب التطبيق العادي اللي بتستخدمه دلوقتي) — هيديوك:
//   - Merchant/Username
//   - API Key
//   - Secret Key
//   - رابط الـ API (Sandbox الأول، وبعدين Production)
// حط القيم دي في متغيرات البيئة (JT_*) وغيّر JT_ENABLED=true عشان يشتغل.
//
// الشكل العام لطلبات J&T (حسب توثيقهم المعتاد): بيتبعت data كـ JSON، وتوقيع
// (signature) = base64(MD5(json + secret_key)) — النمط ده بيتكرر في كل نسخهم.
// المهم إن الدالة دي متتنادوش أبداً من كود المتصفح — بس من API routes.
// ============================================================
import crypto from "crypto";

function signPayload(jsonString, secretKey) {
  return Buffer.from(
    crypto.createHash("md5").update(jsonString + secretKey).digest("hex")
  ).toString("base64");
}

export async function createJtShipment(order) {
  if (process.env.JT_ENABLED !== "true") {
    return { enabled: false, message: "J&T مش متفعّل لسه — راجع lib/jtExpress.js" };
  }
  const baseUrl = process.env.JT_API_BASE_URL;
  const secretKey = process.env.JT_SECRET_KEY;
  const payload = {
    username: process.env.JT_MERCHANT_USERNAME,
    api_key: process.env.JT_API_KEY,
    orderid: order.id,
    receiver_name: order.customerName,
    receiver_phone: order.customerPhone,
    receiver_addr: `${order.street}, مبنى ${order.building || "-"}, طابق ${order.floor || "-"}, شقة ${order.flat || "-"}`,
    receiver_area: order.area,
    receiver_city: order.city,
    receiver_province: order.province,
    goodsdesc: order.items.map((i) => i.nameAr).join(", "),
    weight: "1",
    cod: String(order.total), // الدفع عند الاستلام — عدّل لو نظام الدفع مختلف
  };
  const dataJson = JSON.stringify({ detail: [payload] });
  const sign = signPayload(dataJson, secretKey);

  const res = await fetch(`${baseUrl}/order/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data_param: dataJson, data_sign: sign }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error("فشل إنشاء شحنة J&T: " + (data?.message || res.status));
  }
  // عدّل حسب شكل الرد الفعلي اللي هيرجعلك بعد ما تاخد التوثيق النهائي من J&T
  return { enabled: true, waybillNo: data.waybillNo || data.awb || null, raw: data };
}
