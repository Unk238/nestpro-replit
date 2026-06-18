import { Router } from "express";
import { db, roomsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/floors/:floorId/rooms", async (req, res) => {
  try {
    const floorId = parseInt(req.params.floorId);
    const rows = await db.select().from(roomsTable).where(eq(roomsTable.floorId, floorId)).orderBy(roomsTable.number);
    res.json(rows.map((r) => ({ ...r, monthlyRent: r.monthlyRent ? Number(r.monthlyRent) : null })));
  } catch (err) {
    req.log.error({ err }, "Failed to list rooms");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/floors/:floorId/rooms", async (req, res) => {
  try {
    const floorId = parseInt(req.params.floorId);
    const { number, type, hasAC, hasAttachedBath, monthlyRent } = req.body;
    if (!number || !type) return res.status(400).json({ error: "number, type required" });
    const [room] = await db.insert(roomsTable).values({ floorId, number, type, hasAC: !!hasAC, hasAttachedBath: !!hasAttachedBath, monthlyRent: monthlyRent?.toString() }).returning();
    res.status(201).json({ ...room, monthlyRent: room.monthlyRent ? Number(room.monthlyRent) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to create room");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/rooms/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { number, type, hasAC, hasAttachedBath, monthlyRent } = req.body;
    const [room] = await db.update(roomsTable).set({ number, type, hasAC, hasAttachedBath, monthlyRent: monthlyRent?.toString() }).where(eq(roomsTable.id, id)).returning();
    if (!room) return res.status(404).json({ error: "Not found" });
    res.json({ ...room, monthlyRent: room.monthlyRent ? Number(room.monthlyRent) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to update room");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/rooms/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(roomsTable).where(eq(roomsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete room");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
