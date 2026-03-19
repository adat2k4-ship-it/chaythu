import axios from 'axios';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TABLE_URL = `${SUPABASE_URL}/rest/v1/expenses`;

export async function saveExpense(data) {
  try {
    const res = await axios.post(TABLE_URL, data, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'X-Client-Info': 'supabase-js-web/2.0.0' // Thêm dòng này
      }
    });
    return res.data;
  } catch (error) {
    console.error('Lỗi lưu:', error.response?.data || error.message);
    throw error;
  }
}

export async function getExpenses() {
  try {
    const res = await axios.get(TABLE_URL, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return res.data;
  } catch (error) {
    console.error('Lỗi đọc:', error.response?.data || error.message);
    return [];
  }
}