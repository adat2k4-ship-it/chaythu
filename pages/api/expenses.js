import { getExpenses } from '../../lib/supabase.js';

export default async function handler(req, res) {
  try {
    const expenses = await getExpenses();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}