import { Router } from 'express';
import { db, beds } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/rooms/:roomId/beds', async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  const result = await db.select().from(beds).where(eq(beds.roomId, roomId)).orderBy(beds.label);
  res.json(result.map((b) => ({ ...b, monthlyRent: Number(b.monthlyRent) })));
});

router.post('/rooms/:roomId/beds', async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  const { label, monthlyRent, status } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  const [bed] = await db.insert(beds).values({ roomId, label, monthlyRent: monthlyRent?.toString(), status: status ?? 'available' }).returning();
  res.status(201).json({ ...bed, monthlyRent: Number(bed.monthlyRent) });
});

router.patch('/beds/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { label, monthlyRent, status } = req.body;
  const updateData: Record<string, any> = {};
  if (label !== undefined) updateData.label = label;
  if (monthlyRent !== undefined) updateData.monthlyRent = monthlyRent.toString();
  if (status !== undefined) updateData.status = status;
  const [bed] = await db.update(beds).set(updateData).where(eq(beds.id, id)).returning();
  if (!bed) return res.status(404).json({ error: 'Not found' });
  res.json({ ...bed, monthlyRent: Number(bed.monthlyRent) });
});

router.delete('/beds/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(beds).where(eq(beds.id, id));
  res.json({ ok: true });
});

export default router;
