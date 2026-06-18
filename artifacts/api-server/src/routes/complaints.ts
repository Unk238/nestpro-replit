import { Router } from "express";
import { db, complaintsTable, guestsTable, propertiesTable, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logActivity } from "./activity";

const router = Router();

router.get("/complaints", async (req, res) => {
  try {
    const { propertyId, status } = req.query;
    let rows = await db.select().from(complaintsTable).orderBy(complaintsTable.createdAt);
    if (propertyId) rows = rows.filter((c) => c.propertyId === parseInt(propertyId as string));
    if (status) rows = rows.filter((c) => c.status === status);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list complaints");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/complaints", async (req, res) => {
  try {
    const { guestId, propertyId, title, description, category, priority } = req.body;
    if (!guestId || !propertyId || !title || !category || !priority) {
      return res.status(400).json({ error: "guestId, propertyId, title, category, priority required" });
    }
    const [complaint] = await db.insert(complaintsTable).values({
      guestId, propertyId, title, description, category, priority, status: "pending",
    }).returning();

    const [prop] = await db.select({ name: propertiesTable.name }).from(propertiesTable).where(eq(propertiesTable.id, propertyId));
    const [guest] = await db.select({ name: guestsTable.name }).from(guestsTable).where(eq(guestsTable.id, guestId));
    await logActivity("created", "complaint", complaint.id, `Complaint by ${guest?.name ?? "guest"}: "${title}"`, propertyId, prop?.name);

    res.status(201).json(complaint);
  } catch (err) {
    req.log.error({ err }, "Failed to create complaint");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/complaints/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id));
    if (!complaint) return res.status(404).json({ error: "Not found" });
    res.json(complaint);
  } catch (err) {
    req.log.error({ err }, "Failed to get complaint");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/complaints/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, assignedTo, priority, description } = req.body;
    const resolvedAt = status === "resolved" || status === "closed" ? new Date() : undefined;
    const [complaint] = await db.update(complaintsTable).set({
      status, assignedTo, priority, description,
      ...(resolvedAt ? { resolvedAt } : {}),
    }).where(eq(complaintsTable.id, id)).returning();
    if (!complaint) return res.status(404).json({ error: "Not found" });
    await logActivity("updated", "complaint", id, `Complaint status → ${status ?? "updated"}`, complaint.propertyId);
    res.json(complaint);
  } catch (err) {
    req.log.error({ err }, "Failed to update complaint");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
