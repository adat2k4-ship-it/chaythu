import { createWorker } from 'tesseract.js';
import fs from 'fs';

export async function runOCR(imagePath) {
  console.log("🔍 Bắt đầu OCR với Tesseract.js (miễn phí)...");
  
  try {
    // Kiểm tra file tồn tại
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File không tồn tại: ${imagePath}`);
    }

    // Đọc file ảnh
    const imageBuffer = fs.readFileSync(imagePath);
    console.log("✅ Đã đọc file, dung lượng:", imageBuffer.length, "bytes");

    // Tạo worker với cấu hình đơn giản (không dùng logger phức tạp)
    const worker = await createWorker();
    
    // Tải ngôn ngữ tiếng Việt
    console.log("📚 Đang tải ngôn ngữ tiếng Việt...");
    await worker.loadLanguage('vie');
    await worker.initialize('vie');
    
    // Nhận dạng chữ
    console.log("🔍 Đang nhận dạng chữ...");
    const { data } = await worker.recognize(imageBuffer);
    
    // Dọn dẹp
    await worker.terminate();

    const text = data.text;
    console.log("✅ OCR thành công!");
    console.log("📝 Text nhận được:", text.substring(0, 200) + "...");

    if (!text || text.trim().length === 0) {
      throw new Error("Không tìm thấy chữ trong ảnh");
    }

    return text;

  } catch (error) {
    console.error("❌ Lỗi OCR chi tiết:", error);
    throw error;
  }
}