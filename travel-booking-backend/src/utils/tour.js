export const cleanupUploadedFiles = (files) => {
  if (!files) return;
  const list = Array.isArray(files) ? files : [files];
  list.forEach((filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  });
};
// 2. Helper parse an toàn JSON từ FormData
export const safeJsonParse = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return Array.isArray(val) ? val : [];
};
