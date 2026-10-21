import crypto from "crypto";
import qs from "qs";

// =====================================================
// 1. FORMAT DATE - Định dạng YYYYMMDDHHmmss theo GMT+7
// =====================================================
const formatDate = (date) => {
  // Đảm bảo lấy đúng giờ Việt Nam (GMT+7) bất kể server ở timezone nào
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || "00";

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
};

// =====================================================
// 2. SORT OBJECT - Sắp xếp tham số theo alphabet ASCII
// =====================================================
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;

  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();

  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// =====================================================
// 3. CREATE VNPAY URL
// =====================================================
export const createVNPayUrl = ({ paymentCode, amount, ipAddr, orderInfo }) => {
  const tmnCode = (process.env.VNP_TMNCODE || "").trim();
  const secretKey = (process.env.VNP_HASH_SECRET || "").trim();
  const vnpUrl = (process.env.VNP_URL || "").trim();
  const returnUrl = (process.env.VNP_RETURN_URL || "").trim();

  if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
    throw new Error(
      "Thiếu cấu hình VNPAY (VNP_TMNCODE / VNP_HASH_SECRET / VNP_URL / VNP_RETURN_URL)",
    );
  }

  const paymentAmount = Number(amount);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error("Số tiền thanh toán VNPay không hợp lệ");
  }

  const txnRef = String(paymentCode || "").trim();
  if (!txnRef || txnRef.length > 50) {
    throw new Error("Mã thanh toán VNPay không hợp lệ hoặc quá dài");
  }

  const now = new Date();
  const createDate = formatDate(now);
  const expireDate = formatDate(new Date(now.getTime() + 15 * 60 * 1000));

  let ipAddress = String(ipAddr || "").trim();
  if (!ipAddress || ipAddress === "localhost" || ipAddress === "::1") {
    ipAddress = "127.0.0.1";
  } else if (ipAddress.startsWith("::ffff:")) {
    ipAddress = ipAddress.slice("::ffff:".length);
  } else if (ipAddress.includes(":")) {
    ipAddress = "127.0.0.1";
  }

  let vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: String(orderInfo || `Thanh toan booking ${txnRef}`).trim(),
    vnp_OrderType: "other",
    vnp_Amount: Math.round(paymentAmount * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddress,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  // Sắp xếp và encode chuẩn VNPAY
  vnpParams = sortObject(vnpParams);

  // Tạo chuỗi signData với encode: false vì sortObject đã encodeURIComponent
  const signData = qs.stringify(vnpParams, { encode: false });
  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  vnpParams["vnp_SecureHash"] = secureHash;

  const paymentUrl = `${vnpUrl}?${qs.stringify(vnpParams, { encode: false })}`;
  return paymentUrl;
};

// =====================================================
// 4. VERIFY VNPAY RETURN
// =====================================================
export const verifyVNPayReturn = (query) => {
  const secretKey = (process.env.VNP_HASH_SECRET || "").trim();

  if (!secretKey) {
    throw new Error("Thiếu cấu hình VNP_HASH_SECRET");
  }

  const vnpParams = { ...query };
  const secureHash = vnpParams.vnp_SecureHash;

  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  // Lọc chỉ lấy các key bắt đầu bằng vnp_ và có giá trị
  const cleanedParams = {};
  for (const key of Object.keys(vnpParams)) {
    if (
      key.startsWith("vnp_") &&
      vnpParams[key] !== undefined &&
      vnpParams[key] !== null &&
      vnpParams[key] !== ""
    ) {
      cleanedParams[key] = vnpParams[key];
    }
  }

  // Sắp xếp đúng quy cách ASCII encode
  const sortedParams = sortObject(cleanedParams);
  const signData = qs.stringify(sortedParams, { encode: false });

  const signed = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (
    typeof secureHash !== "string" ||
    !/^[a-fA-F0-9]{128}$/.test(secureHash)
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(secureHash.toLowerCase(), "hex"),
    Buffer.from(signed.toLowerCase(), "hex"),
  );
};
