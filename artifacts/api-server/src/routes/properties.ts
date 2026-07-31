import { Router } from 'express';
import { db, properties, buildings, floors, rooms, beds, guests } from '@workspace/db';
import { eq, and, count, sql } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /properties — list all with occupancy stats
router.get('/properties', async (_req, res) => {
  const props = await db.select().from(properties).orderBy(properties.createdAt);

  const result = await Promise.all(
    props.map(async (p) => {
      const [totalRow] = await db
        .select({ total: count() })
        .from(beds)
        .innerJoin(rooms, eq(beds.roomId, rooms.id))
        .innerJoin(floors, eq(rooms.floorId, floors.id))
        .innerJoin(buildings, eq(floors.buildingId, buildings.id))
        .where(eq(buildings.propertyId, p.id));

      const [occupiedRow] = await db
        .select({ occupied: count() })
        .from(beds)
        .innerJoin(rooms, eq(beds.roomId, rooms.id))
        .innerJoin(floors, eq(rooms.floorId, floors.id))
        .innerJoin(buildings, eq(floors.buildingId, buildings.id))
        .where(and(eq(buildings.propertyId, p.id), eq(beds.status, 'occupied')));

      const total = Number(totalRow?.total ?? 0);
      const occupied = Number(occupiedRow?.occupied ?? 0);
      return {
        ...p,
        totalBeds: total,
        occupiedBeds: occupied,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    })
  );

  res.json(result);
});

// POST /properties
router.post('/properties', async (req, res) => {
  const { name, address, city, state, type, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const [prop] = await db.insert(properties).values({ name, address, city, state, type, description }).returning();
  await logActivity({ action: 'created', entity: 'property', entityId: prop.id, description: `Property "${name}" created`, propertyId: prop.id, propertyName: name });
  res.status(201).json(prop);
});

// GET /properties/:id
router.get('/properties/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const [prop] = await db.select().from(properties).where(eq(properties.id, id));
  if (!prop) return res.status(404).json({ error: 'Not found' });

  const [totalRow] = await db
    .select({ total: count() })
    .from(beds)
    .innerJoin(rooms, eq(beds.roomId, rooms.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .innerJoin(buildings, eq(floors.buildingId, buildings.id))
    .where(eq(buildings.propertyId, id));

  const [occupiedRow] = await db
    .select({ occupied: count() })
    .from(beds)
    .innerJoin(rooms, eq(beds.roomId, rooms.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .innerJoin(buildings, eq(floors.buildingId, buildings.id))
    .where(and(eq(buildings.propertyId, id), eq(beds.status, 'occupied')));

  const total = Number(totalRow?.total ?? 0);
  const occupied = Number(occupiedRow?.occupied ?? 0);

  res.json({ ...prop, totalBeds: total, occupiedBeds: occupied, occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0 });
});

// PATCH /properties/:id
router.patch('/properties/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, address, city, state, type, description } = req.body;
  const [prop] = await db.update(properties).set({ name, address, city, state, type, description }).where(eq(properties.id, id)).returning();
  if (!prop) return res.status(404).json({ error: 'Not found' });
  res.json(prop);
});

// DELETE /properties/:id
router.delete('/properties/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const [prop] = await db.select().from(properties).where(eq(properties.id, id));
  if (!prop) return res.status(404).json({ error: 'Not found' });
  await db.delete(properties).where(eq(properties.id, id));
  await logActivity({ action: 'deleted', entity: 'property', entityId: id, description: `Property "${prop.name}" deleted` });
  res.json({ ok: true });
});

// GET /properties/:propertyId/beds — flat list with full location path
router.get('/properties/:propertyId/beds', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);

  const result = await db
    .select({
      id: beds.id,
      label: beds.label,
      status: beds.status,
      monthlyRent: beds.monthlyRent,
      roomId: rooms.id,
      roomName: rooms.name,
      floorId: floors.id,
      floorName: floors.name,
      buildingId: buildings.id,
      buildingName: buildings.name,
    })
    .from(beds)
    .innerJoin(rooms, eq(beds.roomId, rooms.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .innerJoin(buildings, eq(floors.buildingId, buildings.id))
    .where(eq(buildings.propertyId, propertyId));

  res.json(result.map((b) => ({ ...b, monthlyRent: Number(b.monthlyRent) })));
});

export default router;
