import { Router } from 'express';
import { db, payments, guests, properties } from '@workspace/db';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

// IMPORTANT: /payments/overdue must be BEFORE /payments/:id
router.get('/payments/overdue', async (_req, res) => {
  const rows = await db
    .select({
      id: payments.id, amount: payments.amount, month: payments.month, year: payments.year,
      status: payments.status, notes: payments.notes, createdAt: payments.createdAt,
      propertyId: payments.propertyId, guestId: payments.guestId,
      guestName: guests.name, guestPhone: guests.phone,
    })
    .from(payments)
    .innerJoin(guests, eq(payments.guestId, guests.id))
    .where(eq(payments.status, 'overdue'))
    .orderBy(payments.createdAt);
  res.json(rows.map((p) => ({ ...p, amount: Number(p.amount) })));
});

router.get('/payments', async (req, res) => {
  const { propertyId, status, guestId } = req.query;
  const conditions = [];
  if (propertyId) conditions.push(eq(payments.propertyId, parseInt(propertyId as string)));
  if (status) conditions.push(eq(payments.status, status as any));
  if (guestId) conditions.push(eq(payments.guestId, parseInt(guestId as string)));

  const rows = await db
    .select({
      id: payments.id, amount: payments.amount, month: payments.month, year: payments.year,
      status: payments.status, paidAt: payments.paidAt, method: payments.method,
      upiRef: payments.upiRef, discount: payments.discount, notes: payments.notes,
      createdAt: payments.createdAt, propertyId: payments.propertyId, guestId: payments.guestId,
      guestName: guests.name,
    })
    .from(payments)
    .innerJoin(guests, eq(payments.guestId, guests.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(payments.createdAt);

  res.json(rows.map((p) => ({ ...p, amount: Number(p.amount), discount: Number(p.discount) })));
});

router.post('/payments', async (req, res) => {
  const { guestId, propertyId, amount, month, year, status, method, upiRef, discount, notes } = req.body;
  if (!guestId || !amount || !month || !year) return res.status(400).json({ error: 'guestId, amount, month, year required' });

  const [payment] = await db.insert(payments).values({
    guestId, propertyId, amount: amount.toString(), month, year,
    status: status ?? 'pending', method, upiRef, discount: discount?.toString(), notes,
    paidAt: status === 'paid' ? new Date() : undefined,
  }).returning();

  const [guest] = await db.select().from(guests).where(eq(guests.id, guestId));
  const [prop] = propertyId ? await db.select().from(properties).where(eq(properties.id, propertyId)) : [null];
  await logActivity({ action: 'payment_recorded', entity: 'payment', entityId: payment.id, description: `Payment ₹${amount} recorded for ${guest?.name}`, propertyId: propertyId ?? undefined, propertyName: prop?.name ?? undefined });
  res.status(201).json({ ...payment, amount: Number(payment.amount), discount: Number(payment.discount) });
});

router.get('/payments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const [payment] = await db.select().from(payments).where(eq(payments.id, id));
  if (!payment) return res.status(404).json({ error: 'Not found' });
  res.json({ ...payment, amount: Number(payment.amount), discount: Number(payment.discount) });
});

router.patch('/payments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, method, upiRef, discount, notes, amount } = req.body;
  const updateData: Record<string, any> = {};
  if (status !== undefined) { updateData.status = status; if (status === 'paid') updateData.paidAt = new Date(); }
  if (method !== undefined) updateData.method = method;
  if (upiRef !== undefined) updateData.upiRef = upiRef;
  if (discount !== undefined) updateData.discount = discount.toString();
  if (notes !== undefined) updateData.notes = notes;
  if (amount !== undefined) updateData.amount = amount.toString();
  const [payment] = await db.update(payments).set(updateData).where(eq(payments.id, id)).returning();
  if (!payment) return res.status(404).json({ error: 'Not found' });
  res.json({ ...payment, amount: Number(payment.amount), discount: Number(payment.discount) });
});

export default router;
