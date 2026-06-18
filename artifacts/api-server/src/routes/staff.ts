import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/staff", async (req, res) => {
  try {
    const rows = await db.select().from(staffTable).orderBy(staffTable.createdAt);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list staff");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/staff", async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;
    if (!name || !phone || !role) return res.status(400).json({ error: "name, phone, role required" });
    const [staff] = await db.insert(staffTable).values({ name, phone, email, role }).returning();
    res.status(201).json(staff);
  } catch (err) {
    req.log.error({ err }, "Failed to create staff");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/staff/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, email, role, isActive } = req.body;
    const [staff] = await db.update(staffTable).set({ name, phone, email, role, isActive }).where(eq(staffTable.id, id)).returning();
    if (!staff) return res.status(404).json({ error: "Not found" });
    res.json(staff);
  } catch (err) {
    req.log.error({ err }, "Failed to update staff");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/staff/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(staffTable).where(eq(staffTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete staff");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
