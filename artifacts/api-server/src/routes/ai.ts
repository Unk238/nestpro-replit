import { Router } from 'express';
import { db, guests, payments, beds } from '@workspace/db';
import { eq, and, count } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

router.post('/ai/chat', async (req, res) => {
  const { message, propertyId } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // Fetch DB context
  const guestFilter = propertyId ? eq(guests.propertyId, parseInt(propertyId)) : undefined;
  const activeGuests = await db.select({ name: guests.name, phone: guests.phone, status: guests.status })
    .from(guests).where(and(guestFilter, eq(guests.status, 'active'))).limit(30);

  const [overdueRow] = await db.select({ cnt: count() }).from(payments).where(eq(payments.status, 'overdue'));
  const [availableRow] = await db.select({ cnt: count() }).from(beds).where(eq(beds.status, 'available'));

  const context = `You are NestPro AI Receptionist — a helpful assistant for a PG/hostel management system in India.
Current data:
- Active guests (${activeGuests.length}): ${activeGuests.map((g) => g.name).join(', ') || 'None'}
- Overdue payments: ${overdueRow?.cnt ?? 0}
- Available beds: ${availableRow?.cnt ?? 0}
Answer the operator's question concisely. If asked about a specific guest or payment not in this data, say you don't have that detail handy.`;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    // Mock response when API key not configured
    const mockResponses: Record<string, string> = {
      default: `Based on current data: ${activeGuests.length} active guests, ${overdueRow?.cnt ?? 0} overdue payments, ${availableRow?.cnt ?? 0} available beds. Please add your Gemini API key to enable full AI responses.`,
    };
    return res.json({ message: mockResponses.default });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`${context}\n\nOperator: ${message}`);
    res.json({ message: result.response.text() });
  } catch (err: any) {
    res.status(500).json({ error: 'AI service error: ' + err.message });
  }
});

export default router;
