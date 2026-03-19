import axios from 'axios';

// Hàm delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeExpense(text, retryCount = 0) {
  try {
    console.log("🤖 Đang phân tích với OpenAI...");

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia phân tích hóa đơn tiếng Việt. 
            Hãy trích xuất thông tin và trả về JSON với format:
            {
              "category": "nguyên liệu" | "điện nước" | "lương" | "khác",
              "amount": số tiền (chỉ lấy số, không có dấu phẩy),
              "description": "mô tả ngắn gọn"
            }`
          },
          {
            role: 'user',
            content: `Hãy phân tích hóa đơn sau:\n${text}`
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log("✅ OpenAI phản hồi:", content);
    
    // Tìm JSON trong response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Không tìm thấy JSON trong response");

  } catch (error) {
    // Xử lý lỗi rate limit (429)
    if (error.response?.status === 429) {
      if (retryCount < 3) { // Thử lại tối đa 3 lần
        const waitTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`⏳ Rate limit, đợi ${waitTime/1000}s rồi thử lại... (Lần ${retryCount + 1}/3)`);
        await sleep(waitTime);
        return analyzeExpense(text, retryCount + 1);
      } else {
        console.error("❌ Đã thử lại 3 lần nhưng vẫn lỗi rate limit");
        throw new Error("OpenAI đang quá tải, vui lòng thử lại sau");
      }
    }
    
    // Các lỗi khác
    console.error('❌ Lỗi OpenAI:', error.response?.data || error.message);
    throw error;
  }
}