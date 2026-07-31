import { Router } from 'express';
import { db, floors } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/buildings/:buildingId/floors', async (req, res) => {
  const buildingId = parseInt(req.params.buildingId);
  const result = await db.select().from(floors).where(eq(floors.buildingId, buildingId)).orderBy(floors.floorNumber);
  res.json(result);
});

router.post('/buildings/:buildingId/floors', async (req, res) => {
  const buildingId = parseInt(req.params.buildingId);
  const { name, floorNumber } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const [floor] = await db.insert(floors).values({ buildingId, name, floorNumber: floorNumber ?? 0 }).returning();
  res.status(201).json(floor);
});

router.patch('/floors/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, floorNumber } = req.body;
  const [floor] = await db.update(floors).set({ name, floorNumber }).where(eq(floors.id, id)).returning();
  if (!floor) return res.status(404).json({ error: 'Not found' });
  res.json(floor);
});

router.delete('/floors/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(floors).where(eq(floors.id, id));
  res.json({ ok: true });
});

export default router;
