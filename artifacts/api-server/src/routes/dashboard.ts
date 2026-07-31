import { Router } from 'express';
import { db, properties, buildings, floors, rooms, beds, guests, payments, activityLogs } from '@workspace/db';
import { eq, and, count, sum, sql } from 'drizzle-orm';

const router = Router();

router.get('/dashboard/summary', async (req, res) => {
  const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;

  // Total beds
  let bedsQuery = db.select({ total: count() }).from(beds)
    .innerJoin(rooms, eq(beds.roomId, rooms.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .innerJoin(buildings, eq(floors.buildingId, buildings.id));
  if (propertyId) bedsQuery = bedsQuery.where(eq(buildings.propertyId, propertyId)) as any;
  const [totalRow] = await bedsQuery;

  // Occupied beds
  let occupiedQuery = db.select({ occupied: count() }).from(beds)
    .innerJoin(rooms, eq(beds.roomId, rooms.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .innerJoin(buildings, eq(floors.buildingId, buildings.id))
    .where(propertyId
      ? and(eq(buildings.propertyId, propertyId), eq(beds.status, 'occupied'))
      : eq(beds.status, 'occupied'));
  const [occupiedRow] = await occupiedQuery;

  // Active guests
  const guestCond = propertyId ? and(eq(guests.status, 'active'), eq(guests.propertyId, propertyId)) : eq(guests.status, 'active');
  const [guestsRow] = await db.select({ active: count() }).from(guests).where(guestCond);

  // Monthly revenue (current month)
  const now = new Date();
  const paymentCond = propertyId
    ? and(eq(payments.status, 'paid'), eq(payments.month, now.getMonth() + 1), eq(payments.year, now.getFullYear()), eq(payments.propertyId, propertyId))
    : and(eq(payments.status, 'paid'), eq(payments.month, now.getMonth() + 1), eq(payments.year, now.getFullYear()));
  const [revenueRow] = await db.select({ total: sum(payments.amount) }).from(payments).where(paymentCond);

  // Overdue count
  const overdueCond = propertyId ? and(eq(payments.status, 'overdue'), eq(payments.propertyId, propertyId)) : eq(payments.status, 'overdue');
  const [overdueRow] = await db.select({ cnt: count() }).from(payments).where(overdueCond);

  const total = Number(totalRow?.total ?? 0);
  const occupied = Number(occupiedRow?.occupied ?? 0);

  res.json({
    totalBeds: total,
    activeGuests: Number(guestsRow?.active ?? 0),
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    monthlyRevenue: Number(revenueRow?.total ?? 0),
    overdueCount: Number(overdueRow?.cnt ?? 0),
  });
});

router.get('/dashboard/revenue', async (req, res) => {
  const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const base = propertyId
      ? and(eq(payments.month, m), eq(payments.year, y), eq(payments.propertyId, propertyId))
      : and(eq(payments.month, m), eq(payments.year, y));
    const [collected] = await db.select({ total: sum(payments.amount) }).from(payments).where(and(base, eq(payments.status, 'paid')));
    const [pending] = await db.select({ total: sum(payments.amount) }).from(payments).where(and(base, eq(payments.status, 'pending')));
    result.push({ month: m, year: y, monthName: MONTH_NAMES[m - 1], collected: Number(collected?.total ?? 0), pending: Number(pending?.total ?? 0) });
  }
  res.json(result);
});

router.get('/dashboard/occupancy', async (req, res) => {
  const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;

  const bs = await db.select().from(buildings).where(propertyId ? eq(buildings.propertyId, propertyId) : undefined);
  const result = await Promise.all(bs.map(async (b) => {
    const fs = await db.select().from(floors).where(eq(floors.buildingId, b.id));
    const floorData = await Promise.all(fs.map(async (f) => {
      const rs = await db.select().from(rooms).where(eq(rooms.floorId, f.id));
      const roomData = await Promise.all(rs.map(async (r) => {
        const bs2 = await db.select().from(beds).where(eq(beds.roomId, r.id));
        return { ...r, beds: bs2.map((bed) => ({ ...bed, monthlyRent: Number(bed.monthlyRent) })) };
      }));
      return { ...f, rooms: roomData };
    }));
    return { ...b, floors: floorData };
  }));
  res.json(result);
});

router.get('/dashboard/recent-activity', async (req, res) => {
  const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;
  const rows = await db.select().from(activityLogs)
    .where(propertyId ? eq(activityLogs.propertyId, propertyId) : undefined)
    .orderBy(sql`${activityLogs.createdAt} desc`)
    .limit(20);
  res.json(rows);
});

export default router;
