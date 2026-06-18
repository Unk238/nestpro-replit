import { Router } from "express";
import { db, floorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/buildings/:buildingId/floors", async (req, res) => {
  try {
    const buildingId = parseInt(req.params.buildingId);
    const rows = await db.select().from(floorsTable).where(eq(floorsTable.buildingId, buildingId)).orderBy(floorsTable.number);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list floors");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/buildings/:buildingId/floors", async (req, res) => {
  try {
    const buildingId = parseInt(req.params.buildingId);
    const { number, name } = req.body;
    if (number === undefined || !name) return res.status(400).json({ error: "number, name required" });
    const [floor] = await db.insert(floorsTable).values({ buildingId, number, name }).returning();
    res.status(201).json(floor);
  } catch (err) {
    req.log.error({ err }, "Failed to create floor");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/floors/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { number, name } = req.body;
    const [floor] = await db.update(floorsTable).set({ number, name }).where(eq(floorsTable.id, id)).returning();
    if (!floor) return res.status(404).json({ error: "Not found" });
    res.json(floor);
  } catch (err) {
    req.log.error({ err }, "Failed to update floor");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/floors/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(floorsTable).where(eq(floorsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete floor");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
