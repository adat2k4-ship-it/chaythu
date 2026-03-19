import Tesseract from 'tesseract.js';
import fs from 'fs';

export async function runOCR(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    
    const { data } = await Tesseract.recognize(
      imageBuffer,
      'vie',
      {
        logger: progress => console.log(`⏳ OCR: ${progress.status} ${progress.progress*100}%`)
      }
    );
    
    return data.text;
  } catch (error) {
    console.error("❌ Lỗi OCR:", error);
    throw error;
  }
}