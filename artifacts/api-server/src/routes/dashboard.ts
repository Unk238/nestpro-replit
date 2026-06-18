import { Router } from "express";
import { db, propertiesTable, bedsTable, guestsTable, paymentsTable, complaintsTable, roomsTable, floorsTable, buildingsTable, activityLogsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;

    const props = await db.select().from(propertiesTable);
    const totalProperties = props.length;

    // Beds
    let bedsQuery = db
      .select({ status: bedsTable.status })
      .from(bedsTable)
      .innerJoin(roomsTable, eq(bedsTable.roomId, roomsTable.id))
      .innerJoin(floorsTable, eq(roomsTable.floorId, floorsTable.id))
      .innerJoin(buildingsTable, eq(floorsTable.buildingId, buildingsTable.id));

    const allBeds = propertyId
      ? await bedsQuery.where(eq(buildingsTable.propertyId, propertyId))
      : await bedsQuery;

    const totalBeds = allBeds.length;
    const occupiedBeds = allBeds.filter((b) => b.status === "occupied").length;
    const availableBeds = allBeds.filter((b) => b.status === "available").length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Guests
    let guestRows = await db.select({ status: guestsTable.status, checkInDate: guestsTable.checkInDate, checkOutDate: guestsTable.checkOutDate, propertyId: guestsTable.propertyId }).from(guestsTable);
    if (propertyId) guestRows = guestRows.filter((g) => g.propertyId === propertyId);
    const today = new Date().toISOString().split("T")[0];
    const activeGuests = guestRows.filter((g) => g.status === "active").length;
    const totalGuests = guestRows.length;
    const checkInsToday = guestRows.filter((g) => g.checkInDate === today).length;
    const checkOutsToday = guestRows.filter((g) => g.checkOutDate === today).length;

    // Payments
    let pmtRows = await db.select({ amount: paymentsTable.amount, status: paymentsTable.status, propertyId: paymentsTable.propertyId }).from(paymentsTable);
    if (propertyId) pmtRows = pmtRows.filter((p) => p.propertyId === propertyId);
    const collectedRevenue = pmtRows.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    const pendingRevenue = pmtRows.filter((p) => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + Number(p.amount), 0);
    const totalRevenue = collectedRevenue + pendingRevenue;
    const overduePayments = pmtRows.filter((p) => p.status === "overdue").length;

    // Complaints
    let compRows = await db.select({ status: complaintsTable.status, propertyId: complaintsTable.propertyId }).from(complaintsTable);
    if (propertyId) compRows = compRows.filter((c) => c.propertyId === propertyId);
    const openComplaints = compRows.filter((c) => c.status !== "closed" && c.status !== "resolved").length;

    res.json({
      totalProperties,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      totalGuests,
      activeGuests,
      checkInsToday,
      checkOutsToday,
      totalRevenue,
      collectedRevenue,
      pendingRevenue,
      openComplaints,
      overduePayments,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/occupancy", async (req, res) => {
  try {
    const propertyId = parseInt(req.query.propertyId as string);
    const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId));
    if (!prop) return res.status(404).json({ error: "Property not found" });

    const buildings = await db.select().from(buildingsTable).where(eq(buildingsTable.propertyId, propertyId));
    const activeGuests = await db.select({ id: guestsTable.id, name: guestsTable.name, bedId: guestsTable.bedId }).from(guestsTable).where(and(eq(guestsTable.propertyId, propertyId), eq(guestsTable.status, "active")));
    const guestMap = new Map(activeGuests.map((g) => [g.bedId, { guestName: g.name, guestId: g.id }]));

    const result = await Promise.all(
      buildings.map(async (building) => {
        const floors = await db.select().from(floorsTable).where(eq(floorsTable.buildingId, building.id)).orderBy(floorsTable.number);
        const floorsWithRooms = await Promise.all(
          floors.map(async (floor) => {
            const rooms = await db.select().from(roomsTable).where(eq(roomsTable.floorId, floor.id)).orderBy(roomsTable.number);
            const roomsWithBeds = await Promise.all(
              rooms.map(async (room) => {
                const beds = await db.select().from(bedsTable).where(eq(bedsTable.roomId, room.id)).orderBy(bedsTable.label);
                return {
                  roomId: room.id,
                  roomNumber: room.number,
                  roomType: room.type,
                  beds: beds.map((b) => ({
                    id: b.id,
                    roomId: b.roomId,
                    label: b.label,
                    status: b.status,
                    monthlyRent: b.monthlyRent ? Number(b.monthlyRent) : null,
                    roomNumber: room.number,
                    floorName: floor.name,
                    buildingName: building.name,
                    guestName: guestMap.get(b.id)?.guestName ?? null,
                    guestId: guestMap.get(b.id)?.guestId ?? null,
                  })),
                };
              })
            );
            return { floorId: floor.id, floorName: floor.name, rooms: roomsWithBeds };
          })
        );
        return { buildingId: building.id, buildingName: building.name, floors: floorsWithRooms };
      })
    );

    res.json({ propertyId: prop.id, propertyName: prop.name, buildings: result });
  } catch (err) {
    req.log.error({ err }, "Failed to get occupancy breakdown");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/revenue", async (req, res) => {
  try {
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;

    const now = new Date();
    const months: Array<{ month: number; year: number; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      });
    }

    const pmtRows = await db.select({ amount: paymentsTable.amount, status: paymentsTable.status, month: paymentsTable.month, year: paymentsTable.year, propertyId: paymentsTable.propertyId }).from(paymentsTable);
    const filtered = propertyId ? pmtRows.filter((p) => p.propertyId === propertyId) : pmtRows;

    const result = months.map(({ month, year, label }) => {
      const rows = filtered.filter((p) => p.month === month && p.year === year);
      const collected = rows.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
      const pending = rows.filter((p) => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + Number(p.amount), 0);
      return { month, year, label, collected, pending, total: collected + pending };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get revenue stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-activity", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "20");
    const rows = await db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt)).limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
