import { Router } from 'express';
import { db, buildings, properties } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

router.get('/properties/:propertyId/buildings', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  const result = await db.select().from(buildings).where(eq(buildings.propertyId, propertyId)).orderBy(buildings.createdAt);
  res.json(result);
});

router.post('/properties/:propertyId/buildings', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  const { name, totalFloors } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const [prop] = await db.select().from(properties).where(eq(properties.id, propertyId));
  const [building] = await db.insert(buildings).values({ propertyId, name, totalFloors }).returning();
  await logActivity({ action: 'created', entity: 'building', entityId: building.id, description: `Building "${name}" created`, propertyId, propertyName: prop?.name });
  res.status(201).json(building);
});

router.patch('/buildings/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, totalFloors } = req.body;
  const [building] = await db.update(buildings).set({ name, totalFloors }).where(eq(buildings.id, id)).returning();
  if (!building) return res.status(404).json({ error: 'Not found' });
  res.json(building);
});

router.delete('/buildings/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(buildings).where(eq(buildings.id, id));
  res.json({ ok: true });
});

export default router;
