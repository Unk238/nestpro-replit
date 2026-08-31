import { Router } from 'express';
import { db, utilityMeters, utilityBills, properties } from '@workspace/db';
import { eq, desc } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /properties/:propertyId/meters — List meters
router.get('/properties/:propertyId/meters', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  const rows = await db.select().from(utilityMeters).where(eq(utilityMeters.propertyId, propertyId)).orderBy(utilityMeters.createdAt);
  res.json(rows.map((m) => ({ ...m, unitRate: Number(m.unitRate) })));
});

// POST /properties/:propertyId/meters — Add meter
router.post('/properties/:propertyId/meters', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  const { meterNumber, label, type, unitRate } = req.body;
  if (!meterNumber || !label) return res.status(400).json({ error: 'meterNumber and label are required' });

  const [meter] = await db.insert(utilityMeters).values({
    propertyId,
    meterNumber,
    label,
    type: type || 'electricity',
    unitRate: (unitRate || 9.5).toString(),
  }).returning();

  res.status(201).json({ ...meter, unitRate: Number(meter.unitRate) });
});

// GET /properties/:propertyId/utility-bills — List bills
router.get('/properties/:propertyId/utility-bills', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  const rows = await db
    .select({
      id: utilityBills.id,
      meterId: utilityBills.meterId,
      propertyId: utilityBills.propertyId,
      billingMonth: utilityBills.billingMonth,
      billingYear: utilityBills.billingYear,
      previousReading: utilityBills.previousReading,
      currentReading: utilityBills.currentReading,
      unitsConsumed: utilityBills.unitsConsumed,
      totalAmount: utilityBills.totalAmount,
      splitMethod: utilityBills.splitMethod,
      status: utilityBills.status,
      notes: utilityBills.notes,
      createdAt: utilityBills.createdAt,
      meterLabel: utilityMeters.label,
      meterNumber: utilityMeters.meterNumber,
    })
    .from(utilityBills)
    .innerJoin(utilityMeters, eq(utilityBills.meterId, utilityMeters.id))
    .where(eq(utilityBills.propertyId, propertyId))
    .orderBy(desc(utilityBills.createdAt));

  res.json(rows.map((b) => ({
    ...b,
    previousReading: Number(b.previousReading),
    currentReading: Number(b.currentReading),
    unitsConsumed: Number(b.unitsConsumed),
    totalAmount: Number(b.totalAmount),
  })));
});

// POST /properties/:propertyId/utility-bills — Calculate & record bill
router.post('/properties/:propertyId/utility-bills', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  const { meterId, billingMonth, billingYear, previousReading, currentReading, splitMethod, notes } = req.body;

  if (!meterId || previousReading === undefined || currentReading === undefined) {
    return res.status(400).json({ error: 'meterId, previousReading, currentReading are required' });
  }

  const [meter] = await db.select().from(utilityMeters).where(eq(utilityMeters.id, parseInt(meterId)));
  if (!meter) return res.status(404).json({ error: 'Meter not found' });

  const prev = Number(previousReading);
  const curr = Number(currentReading);
  const units = Math.max(0, curr - prev);
  const rate = Number(meter.unitRate);
  const total = units * rate;

  const [bill] = await db.insert(utilityBills).values({
    meterId: parseInt(meterId),
    propertyId,
    billingMonth: billingMonth || new Date().getMonth() + 1,
    billingYear: billingYear || new Date().getFullYear(),
    previousReading: prev.toString(),
    currentReading: curr.toString(),
    unitsConsumed: units.toString(),
    totalAmount: total.toString(),
    splitMethod: splitMethod || 'equal',
    status: 'calculated',
    notes,
  }).returning();

  const [prop] = await db.select().from(properties).where(eq(properties.id, propertyId));
  await logActivity({
    action: 'utility_calculated',
    entity: 'utility',
    entityId: bill.id,
    description: `Utility bill calculated: ${meter.label} (${units} units · ₹${total.toFixed(0)})`,
    propertyId,
    propertyName: prop?.name,
  });

  res.status(201).json({
    ...bill,
    previousReading: Number(bill.previousReading),
    currentReading: Number(bill.currentReading),
    unitsConsumed: Number(bill.unitsConsumed),
    totalAmount: Number(bill.totalAmount),
  });
});

export default router;
