import { Router } from 'express';
import { db, bookings, properties, rooms, guests } from '@workspace/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /bookings — Central Booking Inbox with channel filtering
router.get('/bookings', async (req, res) => {
  const { propertyId, status, source } = req.query;
  const conditions = [];
  if (propertyId) conditions.push(eq(bookings.propertyId, parseInt(propertyId as string)));
  if (status) conditions.push(eq(bookings.status, status as any));
  if (source) conditions.push(eq(bookings.source, source as any));

  const rows = await db
    .select({
      id: bookings.id,
      propertyId: bookings.propertyId,
      roomId: bookings.roomId,
      guestId: bookings.guestId,
      guestName: bookings.guestName,
      guestPhone: bookings.guestPhone,
      guestEmail: bookings.guestEmail,
      source: bookings.source,
      externalBookingId: bookings.externalBookingId,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      status: bookings.status,
      grossAmount: bookings.grossAmount,
      platformFee: bookings.platformFee,
      netReceivable: bookings.netReceivable,
      amountReceived: bookings.amountReceived,
      settlementStatus: bookings.settlementStatus,
      isExtension: bookings.isExtension,
      originalBookingId: bookings.originalBookingId,
      notes: bookings.notes,
      createdAt: bookings.createdAt,
      propertyName: properties.name,
      roomName: rooms.name,
    })
    .from(bookings)
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt));

  res.json(rows.map((b) => ({
    ...b,
    grossAmount: Number(b.grossAmount),
    platformFee: Number(b.platformFee),
    netReceivable: Number(b.netReceivable),
    amountReceived: Number(b.amountReceived),
  })));
});

// POST /bookings — Create direct or channel booking
router.post('/bookings', async (req, res) => {
  const {
    propertyId, roomId, guestId, guestName, guestPhone, guestEmail, source,
    externalBookingId, checkInDate, checkOutDate, grossAmount, platformFee,
    amountReceived, settlementStatus, isExtension, originalBookingId, notes
  } = req.body;

  if (!propertyId || !guestName || !checkInDate || !checkOutDate || grossAmount === undefined) {
    return res.status(400).json({ error: 'propertyId, guestName, checkInDate, checkOutDate, grossAmount are required' });
  }

  const pFee = Number(platformFee || 0);
  const gross = Number(grossAmount);
  const net = gross - pFee;
  const received = Number(amountReceived || 0);

  const [booking] = await db.insert(bookings).values({
    propertyId: parseInt(propertyId),
    roomId: roomId ? parseInt(roomId) : undefined,
    guestId: guestId ? parseInt(guestId) : undefined,
    guestName,
    guestPhone,
    guestEmail,
    source: source || 'direct',
    externalBookingId,
    checkInDate,
    checkOutDate,
    status: 'confirmed',
    grossAmount: gross.toString(),
    platformFee: pFee.toString(),
    netReceivable: net.toString(),
    amountReceived: received.toString(),
    settlementStatus: settlementStatus || (received >= net ? 'settled' : 'pending'),
    isExtension: isExtension || 'no',
    originalBookingId: originalBookingId ? parseInt(originalBookingId) : undefined,
    notes,
  }).returning();

  const [prop] = await db.select().from(properties).where(eq(properties.id, parseInt(propertyId)));
  await logActivity({
    action: 'booking_created',
    entity: 'booking',
    entityId: booking.id,
    description: `Booking for ${guestName} (${source || 'Direct'}) · ₹${gross}`,
    propertyId: parseInt(propertyId),
    propertyName: prop?.name,
  });

  res.status(201).json({
    ...booking,
    grossAmount: Number(booking.grossAmount),
    platformFee: Number(booking.platformFee),
    netReceivable: Number(booking.netReceivable),
    amountReceived: Number(booking.amountReceived),
  });
});

// POST /bookings/:id/extend — Direct Stay Extension workflow
router.post('/bookings/:id/extend', async (req, res) => {
  const originalId = parseInt(req.params.id);
  const { newCheckOutDate, additionalAmount, notes } = req.body;

  const [orig] = await db.select().from(bookings).where(eq(bookings.id, originalId));
  if (!orig) return res.status(404).json({ error: 'Original booking not found' });

  const addAmt = Number(additionalAmount || 0);

  const [extension] = await db.insert(bookings).values({
    propertyId: orig.propertyId,
    roomId: orig.roomId,
    guestId: orig.guestId,
    guestName: orig.guestName,
    guestPhone: orig.guestPhone,
    guestEmail: orig.guestEmail,
    source: 'direct', // Direct extension
    checkInDate: orig.checkOutDate,
    checkOutDate: newCheckOutDate,
    status: 'extended',
    grossAmount: addAmt.toString(),
    platformFee: '0',
    netReceivable: addAmt.toString(),
    amountReceived: addAmt.toString(),
    settlementStatus: 'settled',
    isExtension: 'yes',
    originalBookingId: originalId,
    notes: notes || `Direct extension from original booking #${orig.externalBookingId || originalId}`,
  }).returning();

  await db.update(bookings).set({ status: 'extended' }).where(eq(bookings.id, originalId));

  const [prop] = await db.select().from(properties).where(eq(properties.id, orig.propertyId));
  await logActivity({
    action: 'booking_extended',
    entity: 'booking',
    entityId: extension.id,
    description: `${orig.guestName} extended stay until ${newCheckOutDate} · ₹${addAmt}`,
    propertyId: orig.propertyId,
    propertyName: prop?.name,
  });

  res.status(201).json(extension);
});

// PATCH /bookings/:id — Update status / payment reconciliation
router.patch('/bookings/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, amountReceived, settlementStatus, notes } = req.body;
  const updateData: Record<string, any> = {};
  if (status !== undefined) updateData.status = status;
  if (amountReceived !== undefined) updateData.amountReceived = amountReceived.toString();
  if (settlementStatus !== undefined) updateData.settlementStatus = settlementStatus;
  if (notes !== undefined) updateData.notes = notes;

  const [updated] = await db.update(bookings).set(updateData).where(eq(bookings.id, id)).returning();
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json(updated);
});

export default router;
