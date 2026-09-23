import crypto from "crypto";
import qs from "qs";

// FORMAT DATE - GMT+7 (Vietnam)
const formatDate = (date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return (
    `${values.year}` +
    `${values.month}` +
    `${values.day}` +
    `${values.hour}` +
    `${values.minute}` +
    `${values.second}`
  );
};

// CREATE VNPAY PAYMENT URL
export const createVNPayUrl = ({ paymentCode, amount, ipAddr }) => {
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = (process.env.VNP_HASH_SECRET || "").trim();
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURN_URL;

  if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
    throw new Error("Thiếu cấu hình VNPAY trong Environment Variables");
  }

  const now = new Date();

  // Thời gian tạo giao dịch
  const createDate = formatDate(now);

  // Hết hạn sau 15 phút
  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
  const vnpExpireDate = formatDate(expireDate);

  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,

    // VNPAY yêu cầu số tiền x100
    vnp_Amount: Math.round(Number(amount) * 100),

    vnp_CurrCode: "VND",

    vnp_TxnRef: String(paymentCode),

    vnp_OrderInfo: `Thanh toan booking ${paymentCode}`,

    vnp_OrderType: "other",

    vnp_Locale: "vn",

    vnp_ReturnUrl: returnUrl,

    vnp_IpAddr: ipAddr || "127.0.0.1",

    vnp_CreateDate: createDate,

    vnp_ExpireDate: vnpExpireDate,
  };

  // Sắp xếp tham số theo alphabet để tạo chuỗi ký
  const signData = qs.stringify(vnpParams, {
    sort: (a, b) => a.localeCompare(b),
    encodeValuesOnly: false,
    format: "RFC1738",
  });

  // Tạo chữ ký HMAC SHA512
  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(signData, "utf-8")
    .digest("hex");

  const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

  console.log("========== VNPAY ==========");
  console.log("CreateDate:", createDate);
  console.log("ExpireDate:", vnpExpireDate);
  console.log("Amount:", vnpParams.vnp_Amount);
  console.log("TxnRef:", vnpParams.vnp_TxnRef);
  console.log("ReturnUrl:", returnUrl);
  console.log("===========================");

  return paymentUrl;
};

// VERIFY VNPAY
export const verifyVNPayReturn = (query) => {
  const secretKey = (process.env.VNP_HASH_SECRET || "").trim();

  const vnpParams = {
    ...query,
  };

  const secureHash = vnpParams.vnp_SecureHash;

  delete vnpParams.vnp_SecureHash;

  delete vnpParams.vnp_SecureHashType;

  const signData = qs.stringify(vnpParams, {
    sort: (a, b) => a.localeCompare(b),

    encodeValuesOnly: false,

    format: "RFC1738",
  });

  const hmac = crypto.createHmac("sha512", secretKey);

  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
};
