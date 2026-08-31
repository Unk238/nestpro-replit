import { Router } from 'express';
import { db, guests, payments, beds, properties, rooms, complaints } from '@workspace/db';
import { eq, and, count } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

router.post('/ai/chat', async (req, res) => {
  const { message, propertyId, language, maxDiscountPercent, minAllowedRate } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // 1. Fetch live DB context for property
  const guestFilter = propertyId ? eq(guests.propertyId, parseInt(propertyId)) : undefined;
  const activeGuests = await db.select({ name: guests.name, phone: guests.phone, checkInDate: guests.checkInDate })
    .from(guests).where(and(guestFilter, eq(guests.status, 'active'))).limit(25);

  const [overdueRow] = await db.select({ cnt: count() }).from(payments).where(eq(payments.status, 'overdue'));
  const [availableBedsRow] = await db.select({ cnt: count() }).from(beds).where(eq(beds.status, 'available'));
  const [pendingComplaintsRow] = await db.select({ cnt: count() }).from(complaints).where(eq(complaints.status, 'pending'));

  const propList = await db.select({ id: properties.id, name: properties.name, type: properties.type, city: properties.city }).from(properties);

  const langCode = language || 'en';
  const langInstructions: Record<string, string> = {
    hi: 'Reply in Hindi (using natural conversational Hindi or Devanagari/Hinglish as appropriate).',
    kn: 'Reply in Kannada (ಕನ್ನಡ).',
    te: 'Reply in Telugu (తెలుగు).',
    ta: 'Reply in Tamil (தமிழ்).',
    ml: 'Reply in Malayalam (മലയാളം).',
    mr: 'Reply in Marathi (मराठी).',
    bn: 'Reply in Bengali (বাংলা).',
    gu: 'Reply in Gujarati (ગુજરાતી).',
    pa: 'Reply in Punjabi (ਪੰਜਾਬੀ).',
    ur: 'Reply in Urdu (اردو).',
    en: 'Reply in clear, professional English.',
  };

  const context = `You are RENTAQ Virtual Receptionist & Operating Assistant for properties in India.
Current live business context:
- Registered properties (${propList.length}): ${propList.map((p) => `${p.name} (${p.type}, ${p.city || ''})`).join('; ') || 'None'}
- Active occupants/guests: ${activeGuests.length}
- Available beds/units: ${availableBedsRow?.cnt ?? 0}
- Overdue payments count: ${overdueRow?.cnt ?? 0}
- Pending maintenance/complaints: ${pendingComplaintsRow?.cnt ?? 0}
- Discount policy: Maximum discount permitted is ${maxDiscountPercent ?? 10}%. Minimum rate allowed is ₹${minAllowedRate ?? 5000}. NEVER invent unauthorized discounts.

Language preference: ${langInstructions[langCode] || langInstructions.en}
Tone: Polite, helpful, concise, realistic, and warm.`;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.json({
      message: `[RENTAQ Assistant]: Live property status: ${activeGuests.length} active occupants, ${availableBedsRow?.cnt ?? 0} units available, ${overdueRow?.cnt ?? 0} overdue payments, ${pendingComplaintsRow?.cnt ?? 0} pending complaints. Configure your Gemini API key in .env for custom AI conversational responses.`,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`${context}\n\nUser/Caller: ${message}`);
    res.json({ message: result.response.text() });
  } catch (err: any) {
    res.status(500).json({ error: 'AI service: ' + err.message });
  }
});

// POST /ai/voice-call-simulate — Interactive AI voice call workflow
router.post('/ai/voice-call-simulate', async (req, res) => {
  const { callerName, callerPhone, callerLanguage, inquiryTopic } = req.body;

  const greetings: Record<string, string> = {
    hi: `नमस्ते ${callerName || 'जी'}, RENTAQ प्रॉपर्टी में आपका स्वागत है। बताइए आज आपकी किस प्रकार सहायता कर सकते हैं?`,
    kn: `ನಮಸ್ಕಾರ ${callerName || ''}, RENTAQ ಪ್ರಾಪರ್ಟಿಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`,
    te: `నమస్కారం ${callerName || ''}, RENTAQ ప్రాపర్టీకి స్వాగతం. మీకు ఎలా సహాయపడగలను?`,
    ta: `வணக்கம் ${callerName || ''}, RENTAQ பண்புகளுக்கு வரவேற்கிறோம். நான் உங்களுக்கு எப்படி உதவ முடியும்?`,
    en: `Hello ${callerName || 'there'}, thank you for calling RENTAQ. How may I assist you with rooms, pricing, or bookings today?`,
  };

  const responseText = greetings[callerLanguage || 'en'] || greetings.en;

  res.json({
    callId: 'call-' + Date.now(),
    status: 'connected',
    greeting: responseText,
    detectedLanguage: callerLanguage || 'en',
  });
});

export default router;
