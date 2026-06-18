import { Router } from "express";
import { db, bedsTable, roomsTable, floorsTable, buildingsTable, guestsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logActivity } from "./activity";

const router = Router();

router.get("/rooms/:roomId/beds", async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const rows = await db.select().from(bedsTable).where(eq(bedsTable.roomId, roomId)).orderBy(bedsTable.label);
    res.json(rows.map((b) => ({ ...b, monthlyRent: b.monthlyRent ? Number(b.monthlyRent) : null })));
  } catch (err) {
    req.log.error({ err }, "Failed to list beds");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/rooms/:roomId/beds", async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const { label, status, monthlyRent } = req.body;
    if (!label) return res.status(400).json({ error: "label required" });
    const [bed] = await db.insert(bedsTable).values({ roomId, label, status: status ?? "available", monthlyRent: monthlyRent?.toString() }).returning();
    res.status(201).json({ ...bed, monthlyRent: bed.monthlyRent ? Number(bed.monthlyRent) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to create bed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/beds/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { label, status, monthlyRent } = req.body;
    const [bed] = await db.update(bedsTable).set({ label, status, monthlyRent: monthlyRent?.toString() }).where(eq(bedsTable.id, id)).returning();
    if (!bed) return res.status(404).json({ error: "Not found" });
    res.json({ ...bed, monthlyRent: bed.monthlyRent ? Number(bed.monthlyRent) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to update bed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/beds/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(bedsTable).where(eq(bedsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete bed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Flat list of all beds in a property with location info
router.get("/properties/:propertyId/beds", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);

    const rows = await db
      .select({
        id: bedsTable.id,
        roomId: bedsTable.roomId,
        label: bedsTable.label,
        status: bedsTable.status,
        monthlyRent: bedsTable.monthlyRent,
        roomNumber: roomsTable.number,
        floorName: floorsTable.name,
        buildingName: buildingsTable.name,
      })
      .from(bedsTable)
      .innerJoin(roomsTable, eq(bedsTable.roomId, roomsTable.id))
      .innerJoin(floorsTable, eq(roomsTable.floorId, floorsTable.id))
      .innerJoin(buildingsTable, eq(floorsTable.buildingId, buildingsTable.id))
      .where(eq(buildingsTable.propertyId, propertyId))
      .orderBy(buildingsTable.name, floorsTable.number, roomsTable.number, bedsTable.label);

    // Enrich with current guest info
    const activeGuests = await db
      .select({ id: guestsTable.id, name: guestsTable.name, bedId: guestsTable.bedId })
      .from(guestsTable)
      .where(and(eq(guestsTable.propertyId, propertyId), eq(guestsTable.status, "active")));

    const guestMap = new Map(activeGuests.map((g) => [g.bedId, { guestName: g.name, guestId: g.id }]));

    res.json(
      rows.map((b) => ({
        ...b,
        monthlyRent: b.monthlyRent ? Number(b.monthlyRent) : null,
        guestName: guestMap.get(b.id)?.guestName ?? null,
        guestId: guestMap.get(b.id)?.guestId ?? null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list property beds");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
