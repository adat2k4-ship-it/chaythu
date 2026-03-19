import tesseract from 'node-tesseract-ocr';
import fs from 'fs';

export async function runOCR(imagePath) {
  console.log("🔍 Bắt đầu OCR với Tesseract native...");
  
  try {
    // Kiểm tra file
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File không tồn tại: ${imagePath}`);
    }

    const config = {
      lang: "vie",        // Tiếng Việt
      oem: 1,             // OCR Engine Mode
      psm: 3,             // Page Segmentation Mode
    };

    console.log("⏳ Đang nhận dạng...");
    const text = await tesseract.recognize(imagePath, config);
    
    console.log("✅ OCR thành công!");
    console.log("📝 Text:", text.substring(0, 200) + "...");
    
    return text;

  } catch (error) {
    console.error("❌ Lỗi OCR:", error);
    throw error;
  }
}