import { Router } from "express";
import { db, buildingsTable, propertiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logActivity } from "./activity";

const router = Router();

// List buildings in a property
router.get("/properties/:propertyId/buildings", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const rows = await db.select().from(buildingsTable).where(eq(buildingsTable.propertyId, propertyId)).orderBy(buildingsTable.createdAt);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list buildings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create building
router.post("/properties/:propertyId/buildings", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId));
    const [building] = await db.insert(buildingsTable).values({ propertyId, name, description }).returning();
    await logActivity("created", "building", building.id, `Added building "${building.name}"`, propertyId, prop?.name);
    res.status(201).json(building);
  } catch (err) {
    req.log.error({ err }, "Failed to create building");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update building
router.patch("/buildings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    const [building] = await db.update(buildingsTable).set({ name, description }).where(eq(buildingsTable.id, id)).returning();
    if (!building) return res.status(404).json({ error: "Not found" });
    res.json(building);
  } catch (err) {
    req.log.error({ err }, "Failed to update building");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete building
router.delete("/buildings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(buildingsTable).where(eq(buildingsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete building");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
