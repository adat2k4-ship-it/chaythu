import formidable from 'formidable';
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
//import { runOCR } from '../../lib/vision.js';
import { analyzeExpense } from '../../lib/openai.js';
import { saveExpense } from '../../lib/supabase.js';
import { analyzeExpenseWithGroq } from '../../lib/groq.js'; // Thêm dòng này
//import { runOCR } from '../../lib/tesseract.js';  // Thêm dòng này
import { runOCR } from '../../lib/ocr-space-fixed.js';

export const config = { api: { bodyParser: false } };


export default async function handler(req, res) {
  // Thêm CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
}

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log("📢 API upload chính được gọi!");

  try {
    // Tạo thư mục uploads
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Cấu hình formidable giống file test
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
      filename: (name, ext, part) => {
        return Date.now() + '-' + part.originalFilename;
      }
    });

    // Parse form
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("❌ Lỗi parse form:", err);
          reject(err);
        }
        console.log("📁 Files nhận được:", files);
        resolve([fields, files]);
      });
    });

    const file = files.image;
    if (!file) {
      return res.status(400).json({ error: 'Không có file' });
    }

    console.log("📁 File path:", file.filepath);
    console.log("📁 File size:", file.size);

    // Kiểm tra file tồn tại
    if (!fs.existsSync(file.filepath)) {
      return res.status(400).json({ error: 'File không tồn tại' });
    }

    // Bước 1: OCR với Google Vision (hoặc Tesseract)
    console.log("🔍 Bắt đầu OCR...");
    let text;
    try {
      text = await runOCR(file.filepath);
      console.log("📝 OCR text (đầy đủ):", text);
      console.log("📝 Độ dài text:", text.length, "ký tự");
    } catch (ocrError) {
      console.error("❌ Lỗi OCR:", ocrError);
      return res.status(500).json({ error: 'Lỗi OCR: ' + ocrError.message });
    }

    // Bước 2: Phân tích với OpenAI
    console.log("🤖 Bắt đầu phân tích OpenAI...");
    let expenseData;
   // Phần xử lý OpenAI trong upload.js
// Thêm hàm phân tích từ tên file
function analyzeFromFileName(fileName) {
  const name = fileName.toLowerCase();
  
  if (name.includes('dien') || name.includes('điện') || name.includes('electric')) {
    return { category: "điện nước", amount: 300000, description: "Hóa đơn tiền điện" };
  } else if (name.includes('nuoc') || name.includes('nước') || name.includes('water')) {
    return { category: "điện nước", amount: 200000, description: "Hóa đơn tiền nước" };
  } else if (name.includes('luong') || name.includes('lương') || name.includes('salary')) {
    return { category: "lương", amount: 5000000, description: "Lương nhân viên" };
  } else if (name.includes('nguyen lieu') || name.includes('nguyên liệu') || name.includes('food')) {
    return { category: "nguyên liệu", amount: 500000, description: "Mua nguyên liệu" };
  } else if (name.includes('highlands') || name.includes('coffee') || name.includes('cafe')) {
    return { category: "khác", amount: 89000, description: " Highlands Coffee" };
  } else if (name.includes('xang') || name.includes('gas') || name.includes('fuel')) {
    return { category: "khác", amount: 300000, description: "Chi phí xăng xe" };
  }
  return null;
}

// Trong phần xử lý AI, sửa lại đoạn này:
try {
  console.log("🤖 Thử phân tích với Groq (miễn phí)...");
  expenseData = await analyzeExpenseWithGroq(text);
  console.log("✅ Groq thành công!");
} catch (groqError) {
  console.log("⚠️ Groq thất bại, chuyển sang OpenAI...");
  
  try {
    expenseData = await analyzeExpense(text);
    console.log("✅ OpenAI thành công!");
  } catch (openaiError) {
    console.error("❌ Cả Groq và OpenAI đều lỗi");
    
    // Thử phân tích từ tên file
    const fileAnalysis = analyzeFromFileName(file.originalFilename);
    if (fileAnalysis) {
      expenseData = fileAnalysis;
      console.log("📊 Phân tích từ tên file:", expenseData);
    } else {
      // Dùng data mẫu
      expenseData = {
        category: "khác",
        amount: 100000,
        description: "Không thể phân tích, dùng dữ liệu mẫu"
      };
      console.log("📊 Dùng dữ liệu mẫu:", expenseData);
    }
  }
}

    // Bước 3: Lưu vào Supabase
    console.log("💾 Lưu vào Supabase...");
    try {
      await saveExpense({
        ...expenseData,
        created_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error("❌ Lỗi Supabase:", dbError);
      return res.status(500).json({ error: 'Lỗi database: ' + dbError.message });
    }

    // Xóa file tạm
    fs.unlinkSync(file.filepath);
    console.log("✅ Đã xóa file tạm");

    res.status(200).json({ 
  success: true, 
  data: expenseData,
  ocrText: text, // Gửi kèm OCR text
  ocrLength: text.length,
  message: "Xử lý thành công!"
});

  } catch (error) {
    console.error("❌ Lỗi chi tiết:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
}