import { Router } from "express";
import { db, propertiesTable, buildingsTable, floorsTable, roomsTable, bedsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { logActivity } from "./activity";

const router = Router();

// List properties with totalBeds and occupiedBeds
router.get("/properties", async (req, res) => {
  try {
    const props = await db.select().from(propertiesTable).orderBy(propertiesTable.createdAt);

    const enriched = await Promise.all(
      props.map(async (p) => {
        const beds = await db
          .select({ status: bedsTable.status })
          .from(bedsTable)
          .innerJoin(roomsTable, eq(bedsTable.roomId, roomsTable.id))
          .innerJoin(floorsTable, eq(roomsTable.floorId, floorsTable.id))
          .innerJoin(buildingsTable, eq(floorsTable.buildingId, buildingsTable.id))
          .where(eq(buildingsTable.propertyId, p.id));

        const totalBeds = beds.length;
        const occupiedBeds = beds.filter((b) => b.status === "occupied").length;
        return { ...p, totalBeds, occupiedBeds };
      })
    );

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to list properties");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create property
router.post("/properties", async (req, res) => {
  try {
    const { name, address, city, state, pincode, phone, type } = req.body;
    if (!name || !address || !city || !type) {
      return res.status(400).json({ error: "name, address, city, type required" });
    }
    const [prop] = await db
      .insert(propertiesTable)
      .values({ name, address, city, state, pincode, phone, type })
      .returning();
    await logActivity("created", "property", prop.id, `Created property "${prop.name}"`, prop.id, prop.name);
    res.status(201).json({ ...prop, totalBeds: 0, occupiedBeds: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create property");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get one property
router.get("/properties/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!prop) return res.status(404).json({ error: "Not found" });

    const beds = await db
      .select({ status: bedsTable.status })
      .from(bedsTable)
      .innerJoin(roomsTable, eq(bedsTable.roomId, roomsTable.id))
      .innerJoin(floorsTable, eq(roomsTable.floorId, floorsTable.id))
      .innerJoin(buildingsTable, eq(floorsTable.buildingId, buildingsTable.id))
      .where(eq(buildingsTable.propertyId, id));

    res.json({ ...prop, totalBeds: beds.length, occupiedBeds: beds.filter((b) => b.status === "occupied").length });
  } catch (err) {
    req.log.error({ err }, "Failed to get property");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update property
router.patch("/properties/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, address, city, state, pincode, phone, type } = req.body;
    const [prop] = await db
      .update(propertiesTable)
      .set({ name, address, city, state, pincode, phone, type })
      .where(eq(propertiesTable.id, id))
      .returning();
    if (!prop) return res.status(404).json({ error: "Not found" });
    await logActivity("updated", "property", prop.id, `Updated property "${prop.name}"`, prop.id, prop.name);
    res.json({ ...prop, totalBeds: 0, occupiedBeds: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to update property");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete property
router.delete("/properties/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!prop) return res.status(404).json({ error: "Not found" });
    await db.delete(propertiesTable).where(eq(propertiesTable.id, id));
    await logActivity("deleted", "property", id, `Deleted property "${prop.name}"`);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete property");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
