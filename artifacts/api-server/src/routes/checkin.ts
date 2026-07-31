import { Router } from 'express';
import { db, checkinTokens, properties, beds, guests } from '@workspace/db';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { logActivity } from '../lib/activity';

const router = Router();

// POST /checkin/generate — operator creates token
router.post('/checkin/generate', async (req, res) => {
  const { propertyId, bedId } = req.body;
  if (!propertyId) return res.status(400).json({ error: 'propertyId is required' });
  const token = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [record] = await db.insert(checkinTokens).values({ token, propertyId, bedId, expiresAt }).returning();
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ id: record.id, token, url: `${baseUrl}/checkin/${token}`, expiresAt });
});

// GET /checkin/submissions — BEFORE /:token to avoid conflict
router.get('/checkin/submissions', async (req, res) => {
  const all = req.query.all === 'true';
  const rows = await db
    .select({
      id: checkinTokens.id, token: checkinTokens.token, status: checkinTokens.status,
      submittedData: checkinTokens.submittedData, notes: checkinTokens.notes,
      createdAt: checkinTokens.createdAt, expiresAt: checkinTokens.expiresAt,
      propertyId: checkinTokens.propertyId, bedId: checkinTokens.bedId,
      propertyName: properties.name,
    })
    .from(checkinTokens)
    .leftJoin(properties, eq(checkinTokens.propertyId, properties.id))
    .where(all ? undefined : eq(checkinTokens.status, 'submitted'))
    .orderBy(checkinTokens.createdAt);
  res.json(rows);
});

// POST /checkin/submissions/:id/approve — BEFORE /:token
router.post('/checkin/submissions/:id/approve', async (req, res) => {
  const id = parseInt(req.params.id);
  const [token] = await db.select().from(checkinTokens).where(eq(checkinTokens.id, id));
  if (!token) return res.status(404).json({ error: 'Not found' });

  const data = token.submittedData as any;
  if (!data) return res.status(400).json({ error: 'No submission data' });

  const [guest] = await db.insert(guests).values({
    name: data.name, phone: data.phone, email: data.email, aadhaar: data.aadhaar,
    emergencyContact: data.emergencyContact, emergencyPhone: data.emergencyPhone,
    occupation: data.occupation, hometown: data.hometown,
    bedId: token.bedId, propertyId: token.propertyId,
    checkInDate: data.checkInDate, monthlyRent: data.monthlyRent?.toString(),
    depositAmount: data.depositAmount?.toString(), notes: data.notes, status: 'active',
  }).returning();

  if (token.bedId) {
    await db.update(beds).set({ status: 'occupied' }).where(eq(beds.id, token.bedId));
  }
  await db.update(checkinTokens).set({ status: 'approved' }).where(eq(checkinTokens.id, id));

  const [prop] = await db.select().from(properties).where(eq(properties.id, token.propertyId));
  await logActivity({ action: 'checkin_approved', entity: 'guest', entityId: guest.id, description: `${data.name} self check-in approved`, propertyId: token.propertyId, propertyName: prop?.name });
  res.json(guest);
});

// POST /checkin/submissions/:id/reject — BEFORE /:token
router.post('/checkin/submissions/:id/reject', async (req, res) => {
  const id = parseInt(req.params.id);
  const { notes } = req.body;
  const [token] = await db.update(checkinTokens).set({ status: 'rejected', notes }).where(eq(checkinTokens.id, id)).returning();
  if (!token) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// GET /checkin/:token — public, AFTER fixed routes
router.get('/checkin/:token', async (req, res) => {
  const { token } = req.params;
  const [record] = await db
    .select({ id: checkinTokens.id, token: checkinTokens.token, status: checkinTokens.status, expiresAt: checkinTokens.expiresAt, propertyId: checkinTokens.propertyId, bedId: checkinTokens.bedId, propertyName: properties.name, propertyType: properties.type, propertyCity: properties.city, propertyState: properties.state })
    .from(checkinTokens)
    .leftJoin(properties, eq(checkinTokens.propertyId, properties.id))
    .where(eq(checkinTokens.token, token));

  if (!record) return res.status(404).json({ error: 'Token not found' });
  if (new Date(record.expiresAt!) < new Date()) return res.status(410).json({ error: 'Token expired' });
  if (record.status === 'approved' || record.status === 'rejected') return res.status(409).json({ error: `Token already ${record.status}` });
  res.json(record);
});

// POST /checkin/:token/submit — public
router.post('/checkin/:token/submit', async (req, res) => {
  const { token } = req.params;
  const [record] = await db.select().from(checkinTokens).where(eq(checkinTokens.token, token));
  if (!record) return res.status(404).json({ error: 'Token not found' });
  if (new Date(record.expiresAt!) < new Date()) return res.status(410).json({ error: 'Token expired' });
  if (record.status !== 'pending') return res.status(409).json({ error: 'Token already used' });

  await db.update(checkinTokens).set({ status: 'submitted', submittedData: req.body }).where(eq(checkinTokens.token, token));
  res.json({ ok: true, message: 'Registration submitted! The operator will review and confirm your check-in.' });
});

export default router;
