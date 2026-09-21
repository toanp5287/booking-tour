import crypto from "crypto";
import qs from "qs";

// FORMAT DATE
const formatDate = (date) => {
  return (
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0")
  );
};

// CREATE VNPAY PAYMENT URL
export const createVNPayUrl = ({ paymentCode, amount, ipAddr }) => {
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = (process.env.VNP_HASH_SECRET || "").trim();

  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURN_URL;

  const now = new Date();

  const createDate = formatDate(now);

  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);

  const vnpExpireDate = formatDate(expireDate);

  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,

    vnp_Amount: Math.round(Number(amount) * 100),

    vnp_CurrCode: "VND",

    vnp_TxnRef: String(paymentCode),

    vnp_OrderInfo: `Thanh toan booking ${paymentCode}`,

    vnp_OrderType: "other",

    vnp_Locale: "vn",

    vnp_ReturnUrl: returnUrl,

    vnp_IpAddr: ipAddr,

    vnp_CreateDate: createDate,

    vnp_ExpireDate: vnpExpireDate,
  };

  const signData = qs.stringify(vnpParams, {
    sort: (a, b) => a.localeCompare(b),

    encodeValuesOnly: false,

    format: "RFC1738",
  });

  const hmac = crypto.createHmac("sha512", secretKey);

  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
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
