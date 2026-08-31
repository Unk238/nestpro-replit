import { Router } from 'express';
import { db, properties, buildings, floors, rooms, beds, guests, bookings } from '@workspace/db';
import { eq, and, count, sql } from 'drizzle-orm';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /properties — list all with occupancy stats & revenue
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

      const [guestCountRow] = await db
        .select({ cnt: count() })
        .from(guests)
        .where(and(eq(guests.propertyId, p.id), eq(guests.status, 'active')));

      const total = Number(totalRow?.total ?? 0);
      const occupied = Number(occupiedRow?.occupied ?? 0);
      const activeGuests = Number(guestCountRow?.cnt ?? 0);

      return {
        ...p,
        totalBeds: total,
        occupiedBeds: occupied,
        activeGuests,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    })
  );

  res.json(result);
});

// POST /properties — Create property
router.post('/properties', async (req, res) => {
  const {
    name, address, city, state, pincode, type, description,
    amenities, rules, wifiSsid, wifiPassword, upiId, contactPhone, contactEmail
  } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

  const [prop] = await db.insert(properties).values({
    name,
    address,
    city,
    state,
    pincode,
    type: type || 'pg',
    description,
    amenities: typeof amenities === 'object' ? JSON.stringify(amenities) : amenities,
    rules,
    wifiSsid,
    wifiPassword,
    upiId,
    contactPhone,
    contactEmail,
    websiteSlug: slug,
  }).returning();

  await logActivity({
    action: 'created',
    entity: 'property',
    entityId: prop.id,
    description: `Property "${name}" (${type || 'pg'}) registered`,
    propertyId: prop.id,
    propertyName: name,
  });

  res.status(201).json(prop);
});

// GET /properties/public/:slug — Public storefront for generated property website
router.get('/properties/public/:slug', async (req, res) => {
  const { slug } = req.params;
  const [prop] = await db.select().from(properties).where(eq(properties.websiteSlug, slug));
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const bs = await db.select().from(buildings).where(eq(buildings.propertyId, prop.id));
  const roomList = await db
    .select({
      id: rooms.id,
      name: rooms.name,
      type: rooms.type,
      buildingName: buildings.name,
      floorName: floors.name,
    })
    .from(rooms)
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .innerJoin(buildings, eq(floors.buildingId, buildings.id))
    .where(eq(buildings.propertyId, prop.id));

  res.json({
    ...prop,
    buildingsCount: bs.length,
    rooms: roomList,
  });
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

  res.json({
    ...prop,
    totalBeds: total,
    occupiedBeds: occupied,
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
  });
});

// PATCH /properties/:id
router.patch('/properties/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    name, address, city, state, pincode, type, description,
    amenities, rules, wifiSsid, wifiPassword, upiId, contactPhone, contactEmail
  } = req.body;

  const updateData: Record<string, any> = {};
  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (pincode !== undefined) updateData.pincode = pincode;
  if (type !== undefined) updateData.type = type;
  if (description !== undefined) updateData.description = description;
  if (amenities !== undefined) updateData.amenities = typeof amenities === 'object' ? JSON.stringify(amenities) : amenities;
  if (rules !== undefined) updateData.rules = rules;
  if (wifiSsid !== undefined) updateData.wifiSsid = wifiSsid;
  if (wifiPassword !== undefined) updateData.wifiPassword = wifiPassword;
  if (upiId !== undefined) updateData.upiId = upiId;
  if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
  if (contactEmail !== undefined) updateData.contactEmail = contactEmail;

  const [prop] = await db.update(properties).set(updateData).where(eq(properties.id, id)).returning();
  if (!prop) return res.status(404).json({ error: 'Not found' });
  res.json(prop);
});

// DELETE /properties/:id
router.delete('/properties/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const [prop] = await db.select().from(properties).where(eq(properties.id, id));
  if (!prop) return res.status(404).json({ error: 'Not found' });
  await db.delete(properties).where(eq(properties.id, id));
  await logActivity({ action: 'deleted', entity: 'property', entityId: id, description: `Property "${prop.name}" removed` });
  res.json({ ok: true });
});

// GET /properties/:propertyId/beds — flat list of all beds
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
