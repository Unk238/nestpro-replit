import { Router } from "express";
import { db, guestsTable, bedsTable, propertiesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logActivity } from "./activity";

const router = Router();

router.get("/guests", async (req, res) => {
  try {
    const { propertyId, status } = req.query;
    let rows = await db.select().from(guestsTable).orderBy(guestsTable.createdAt);
    if (propertyId) rows = rows.filter((g) => g.propertyId === parseInt(propertyId as string));
    if (status) rows = rows.filter((g) => g.status === status);
    res.json(
      rows.map((g) => ({
        ...g,
        monthlyRent: Number(g.monthlyRent),
        depositAmount: g.depositAmount ? Number(g.depositAmount) : null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list guests");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/guests", async (req, res) => {
  try {
    const {
      name, phone, email, aadhaar, emergencyContact, emergencyPhone,
      occupation, hometown, bedId, propertyId, checkInDate, monthlyRent,
      depositAmount, notes,
    } = req.body;
    if (!name || !phone || !bedId || !propertyId || !checkInDate || !monthlyRent) {
      return res.status(400).json({ error: "name, phone, bedId, propertyId, checkInDate, monthlyRent required" });
    }
    // Mark bed as occupied
    await db.update(bedsTable).set({ status: "occupied" }).where(eq(bedsTable.id, bedId));

    const [guest] = await db.insert(guestsTable).values({
      name, phone, email, aadhaar, emergencyContact, emergencyPhone,
      occupation, hometown, bedId, propertyId, checkInDate,
      monthlyRent: monthlyRent.toString(), depositAmount: depositAmount?.toString(), notes,
      status: "active",
    }).returning();

    const [prop] = await db.select({ name: propertiesTable.name }).from(propertiesTable).where(eq(propertiesTable.id, propertyId));
    await logActivity("check_in", "guest", guest.id, `${guest.name} checked in`, propertyId, prop?.name);

    res.status(201).json({
      ...guest,
      monthlyRent: Number(guest.monthlyRent),
      depositAmount: guest.depositAmount ? Number(guest.depositAmount) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create guest");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/guests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, id));
    if (!guest) return res.status(404).json({ error: "Not found" });
    res.json({
      ...guest,
      monthlyRent: Number(guest.monthlyRent),
      depositAmount: guest.depositAmount ? Number(guest.depositAmount) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get guest");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/guests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name, phone, email, aadhaar, emergencyContact, emergencyPhone,
      occupation, hometown, monthlyRent, depositAmount, notes,
    } = req.body;
    const [guest] = await db.update(guestsTable).set({
      name, phone, email, aadhaar, emergencyContact, emergencyPhone,
      occupation, hometown,
      monthlyRent: monthlyRent?.toString(),
      depositAmount: depositAmount?.toString(),
      notes,
    }).where(eq(guestsTable.id, id)).returning();
    if (!guest) return res.status(404).json({ error: "Not found" });
    res.json({
      ...guest,
      monthlyRent: Number(guest.monthlyRent),
      depositAmount: guest.depositAmount ? Number(guest.depositAmount) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update guest");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/guests/:id/checkout", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { checkOutDate, notes } = req.body;
    if (!checkOutDate) return res.status(400).json({ error: "checkOutDate required" });

    const [existing] = await db.select().from(guestsTable).where(eq(guestsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Not found" });

    const [guest] = await db.update(guestsTable).set({
      status: "checked_out",
      checkOutDate,
      notes: notes ?? existing.notes,
    }).where(eq(guestsTable.id, id)).returning();

    // Free up the bed
    await db.update(bedsTable).set({ status: "available" }).where(eq(bedsTable.id, existing.bedId));

    const [prop] = await db.select({ name: propertiesTable.name }).from(propertiesTable).where(eq(propertiesTable.id, existing.propertyId));
    await logActivity("check_out", "guest", guest.id, `${guest.name} checked out`, existing.propertyId, prop?.name);

    res.json({
      ...guest,
      monthlyRent: Number(guest.monthlyRent),
      depositAmount: guest.depositAmount ? Number(guest.depositAmount) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to checkout guest");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
