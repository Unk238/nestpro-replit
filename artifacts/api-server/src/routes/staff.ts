import { Router } from 'express';
import { db, staff } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/staff', async (_req, res) => {
  const result = await db.select().from(staff).orderBy(staff.createdAt);
  res.json(result);
});

router.post('/staff', async (req, res) => {
  const { name, phone, email, role } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'name and role are required' });
  const [member] = await db.insert(staff).values({ name, phone, email, role }).returning();
  res.status(201).json(member);
});

router.patch('/staff/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, email, role, isActive } = req.body;
  const updateData: Record<string, any> = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  const [member] = await db.update(staff).set(updateData).where(eq(staff.id, id)).returning();
  if (!member) return res.status(404).json({ error: 'Not found' });
  res.json(member);
});

router.delete('/staff/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(staff).set({ isActive: false }).where(eq(staff.id, id));
  res.json({ ok: true });
});

export default router;
