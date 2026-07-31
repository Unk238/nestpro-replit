import { Router } from 'express';
import { db, rooms } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/floors/:floorId/rooms', async (req, res) => {
  const floorId = parseInt(req.params.floorId);
  const result = await db.select().from(rooms).where(eq(rooms.floorId, floorId)).orderBy(rooms.createdAt);
  res.json(result);
});

router.post('/floors/:floorId/rooms', async (req, res) => {
  const floorId = parseInt(req.params.floorId);
  const { name, type } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const [room] = await db.insert(rooms).values({ floorId, name, type: type ?? 'single' }).returning();
  res.status(201).json(room);
});

router.patch('/rooms/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, type } = req.body;
  const [room] = await db.update(rooms).set({ name, type }).where(eq(rooms.id, id)).returning();
  if (!room) return res.status(404).json({ error: 'Not found' });
  res.json(room);
});

router.delete('/rooms/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(rooms).where(eq(rooms.id, id));
  res.json({ ok: true });
});

export default router;
