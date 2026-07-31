import { Router } from 'express';
import { db, complaints, guests, properties, staff } from '@workspace/db';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

router.get('/complaints', async (req, res) => {
  const { propertyId, status } = req.query;
  const conditions = [];
  if (propertyId) conditions.push(eq(complaints.propertyId, parseInt(propertyId as string)));
  if (status) conditions.push(eq(complaints.status, status as any));

  const rows = await db
    .select({
      id: complaints.id, title: complaints.title, description: complaints.description,
      category: complaints.category, status: complaints.status, priority: complaints.priority,
      assignedTo: complaints.assignedTo, resolvedAt: complaints.resolvedAt,
      createdAt: complaints.createdAt, propertyId: complaints.propertyId, guestId: complaints.guestId,
      guestName: guests.name,
    })
    .from(complaints)
    .leftJoin(guests, eq(complaints.guestId, guests.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(complaints.createdAt);

  res.json(rows);
});

router.post('/complaints', async (req, res) => {
  const { guestId, propertyId, title, description, category, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const [complaint] = await db.insert(complaints).values({
    guestId, propertyId, title, description, category: category ?? 'other', priority: priority ?? 'medium', status: 'pending',
  }).returning();

  const [prop] = propertyId ? await db.select().from(properties).where(eq(properties.id, propertyId)) : [null];
  await logActivity({ action: 'complaint_created', entity: 'complaint', entityId: complaint.id, description: `Complaint: "${title}"`, propertyId: propertyId ?? undefined, propertyName: prop?.name ?? undefined });
  res.status(201).json(complaint);
});

router.get('/complaints/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
  if (!complaint) return res.status(404).json({ error: 'Not found' });
  res.json(complaint);
});

router.patch('/complaints/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, priority, assignedTo, description } = req.body;
  const updateData: Record<string, any> = {};
  if (status !== undefined) { updateData.status = status; if (status === 'resolved') updateData.resolvedAt = new Date(); }
  if (priority !== undefined) updateData.priority = priority;
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
  if (description !== undefined) updateData.description = description;

  const [complaint] = await db.update(complaints).set(updateData).where(eq(complaints.id, id)).returning();
  if (!complaint) return res.status(404).json({ error: 'Not found' });

  if (status) {
    const [prop] = complaint.propertyId ? await db.select().from(properties).where(eq(properties.id, complaint.propertyId)) : [null];
    await logActivity({ action: 'complaint_updated', entity: 'complaint', entityId: id, description: `Complaint status → ${status}`, propertyId: complaint.propertyId ?? undefined, propertyName: prop?.name ?? undefined });
  }
  res.json(complaint);
});

export default router;
