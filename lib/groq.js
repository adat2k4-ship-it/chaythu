import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_KEY
});

export async function analyzeExpenseWithGroq(text) {
  try {
    console.log("🤖 Đang phân tích với Groq (miễn phí)...");

    const completion = await groq.chat.completions.create({
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
      model: 'llama-3.3-70b-versatile', // Model mới thay thế
      temperature: 0.3,
      max_tokens: 500
    });

    const content = completion.choices[0]?.message?.content;
    console.log("✅ Groq phản hồi:", content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Không tìm thấy JSON trong response");
  } catch (error) {
    console.error('❌ Lỗi Groq:', error);
    throw error;
  }
}