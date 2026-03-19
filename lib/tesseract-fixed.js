const Tesseract = require('tesseract.js');
const fs = require('fs');

module.exports = async function runOCR(imagePath) {
  console.log("🔍 Bắt đầu OCR với Tesseract...");
  
  try {
    // Kiểm tra file
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File không tồn tại: ${imagePath}`);
    }

    // Đọc file
    const image = fs.readFileSync(imagePath);
    console.log("✅ Đã đọc file, dung lượng:", image.length, "bytes");

    // Chạy OCR với cấu hình đơn giản
    const result = await Tesseract.recognize(
      image,
      'vie', // Ngôn ngữ tiếng Việt
      {
        logger: m => console.log(m) // Log tiến trình
      }
    );

    console.log("✅ OCR thành công!");
    return result.data.text;

  } catch (error) {
    console.error("❌ Lỗi OCR:", error);
    throw error;
  }
};