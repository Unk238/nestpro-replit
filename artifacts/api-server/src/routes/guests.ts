import { Router } from 'express';
import { db, guests, beds, properties } from '@workspace/db';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

router.get('/guests', async (req, res) => {
  const { propertyId, status } = req.query;
  const conditions = [];
  if (propertyId) conditions.push(eq(guests.propertyId, parseInt(propertyId as string)));
  if (status) conditions.push(eq(guests.status, status as any));

  const rows = await db
    .select({
      id: guests.id, name: guests.name, phone: guests.phone, email: guests.email,
      aadhaar: guests.aadhaar, emergencyContact: guests.emergencyContact,
      emergencyPhone: guests.emergencyPhone, occupation: guests.occupation,
      hometown: guests.hometown, bedId: guests.bedId, propertyId: guests.propertyId,
      checkInDate: guests.checkInDate, checkOutDate: guests.checkOutDate,
      status: guests.status, monthlyRent: guests.monthlyRent,
      depositAmount: guests.depositAmount, notes: guests.notes, createdAt: guests.createdAt,
      bedLabel: beds.label,
    })
    .from(guests)
    .leftJoin(beds, eq(guests.bedId, beds.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(guests.createdAt);

  res.json(rows.map((g) => ({ ...g, monthlyRent: Number(g.monthlyRent), depositAmount: Number(g.depositAmount) })));
});

router.post('/guests', async (req, res) => {
  const { name, phone, email, aadhaar, emergencyContact, emergencyPhone, occupation, hometown,
    bedId, propertyId, checkInDate, monthlyRent, depositAmount, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const [guest] = await db.insert(guests).values({
    name, phone, email, aadhaar, emergencyContact, emergencyPhone, occupation, hometown,
    bedId, propertyId, checkInDate, monthlyRent: monthlyRent?.toString(),
    depositAmount: depositAmount?.toString(), notes, status: 'active',
  }).returning();

  if (bedId) {
    await db.update(beds).set({ status: 'occupied' }).where(eq(beds.id, bedId));
  }

  const [prop] = propertyId ? await db.select().from(properties).where(eq(properties.id, propertyId)) : [null];
  await logActivity({ action: 'checkin', entity: 'guest', entityId: guest.id, description: `${name} checked in`, propertyId: propertyId ?? undefined, propertyName: prop?.name ?? undefined });
  res.status(201).json({ ...guest, monthlyRent: Number(guest.monthlyRent), depositAmount: Number(guest.depositAmount) });
});

router.get('/guests/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const [guest] = await db.select({
    id: guests.id, name: guests.name, phone: guests.phone, email: guests.email,
    aadhaar: guests.aadhaar, emergencyContact: guests.emergencyContact,
    emergencyPhone: guests.emergencyPhone, occupation: guests.occupation,
    hometown: guests.hometown, bedId: guests.bedId, propertyId: guests.propertyId,
    checkInDate: guests.checkInDate, checkOutDate: guests.checkOutDate,
    status: guests.status, monthlyRent: guests.monthlyRent,
    depositAmount: guests.depositAmount, notes: guests.notes, createdAt: guests.createdAt,
    bedLabel: beds.label,
  }).from(guests).leftJoin(beds, eq(guests.bedId, beds.id)).where(eq(guests.id, id));
  if (!guest) return res.status(404).json({ error: 'Not found' });
  res.json({ ...guest, monthlyRent: Number(guest.monthlyRent), depositAmount: Number(guest.depositAmount) });
});

router.patch('/guests/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, email, aadhaar, emergencyContact, emergencyPhone, occupation, hometown, notes, monthlyRent, depositAmount } = req.body;
  const updateData: Record<string, any> = { name, phone, email, aadhaar, emergencyContact, emergencyPhone, occupation, hometown, notes };
  if (monthlyRent !== undefined) updateData.monthlyRent = monthlyRent.toString();
  if (depositAmount !== undefined) updateData.depositAmount = depositAmount.toString();
  Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);
  const [guest] = await db.update(guests).set(updateData).where(eq(guests.id, id)).returning();
  if (!guest) return res.status(404).json({ error: 'Not found' });
  res.json({ ...guest, monthlyRent: Number(guest.monthlyRent), depositAmount: Number(guest.depositAmount) });
});

router.post('/guests/:id/checkout', async (req, res) => {
  const id = parseInt(req.params.id);
  const [guest] = await db.select().from(guests).where(eq(guests.id, id));
  if (!guest) return res.status(404).json({ error: 'Not found' });
  const today = new Date().toISOString().split('T')[0];
  await db.update(guests).set({ status: 'checked_out', checkOutDate: today }).where(eq(guests.id, id));
  if (guest.bedId) {
    await db.update(beds).set({ status: 'available' }).where(eq(beds.id, guest.bedId));
  }
  const [prop] = guest.propertyId ? await db.select().from(properties).where(eq(properties.id, guest.propertyId)) : [null];
  await logActivity({ action: 'checkout', entity: 'guest', entityId: id, description: `${guest.name} checked out`, propertyId: guest.propertyId ?? undefined, propertyName: prop?.name ?? undefined });
  res.json({ ok: true });
});

export default router;
