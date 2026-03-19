import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export async function runOCR(imagePath) {
  console.log("🔍 Bắt đầu OCR với OCR.space...");
  
  try {
    // Kiểm tra file
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File không tồn tại: ${imagePath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    
    // QUAN TRỌNG: Dùng "auto" thay vì "vie" để tự động nhận diện ngôn ngữ [citation:1][citation:6]
    formData.append('language', 'auto');
    
    // Bắt buộc dùng OCR Engine 2 để hỗ trợ tiếng Việt [citation:4]
    formData.append('OCREngine', '2');
    
    // Các tùy chọn khác
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('isTable', 'false');
    formData.append('apikey', 'K87746431388957'); // Free API key

    console.log("⏳ Đang gửi request tới OCR.space (Engine 2)...");
    
    // Lấy headers từ formData
    const headers = {
      ...formData.getHeaders(),
      'Accept': 'application/json',
    };
    
    console.log("📤 Headers:", headers);

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: headers,
      timeout: 60000, // 60 giây
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log("📥 Response status:", response.status);

    if (!response.data) {
      throw new Error('Không nhận được response từ OCR.space');
    }

    // Kiểm tra lỗi từ API
    if (response.data.IsErroredOnProcessing) {
      console.error("❌ Lỗi từ OCR.space:", response.data.ErrorMessage);
      throw new Error(response.data.ErrorMessage?.join(', ') || 'Lỗi xử lý ảnh');
    }

    if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
      throw new Error('Không tìm thấy kết quả OCR');
    }

    const text = response.data.ParsedResults[0].ParsedText;
    console.log("✅ OCR thành công!");
    console.log("📝 Độ dài text:", text.length, "ký tự");
    
    if (text.length === 0) {
      console.warn("⚠️ Không tìm thấy chữ trong ảnh");
    }
    
    return text;

  } catch (error) {
    console.error("❌ Lỗi OCR chi tiết:");
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout: Server OCR.space quá chậm');
    } else if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Không nhận được response từ server');
    } else {
      console.error('Message:', error.message);
    }
    
    throw error;
  }
}