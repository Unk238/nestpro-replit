import { Router } from "express";
import { db, paymentsTable, guestsTable, propertiesTable } from "@workspace/db";
import { eq, and, lt } from "drizzle-orm";
import { logActivity } from "./activity";

const router = Router();

router.get("/payments", async (req, res) => {
  try {
    const { propertyId, guestId, status } = req.query;
    let rows = await db.select().from(paymentsTable).orderBy(paymentsTable.createdAt);
    if (propertyId) rows = rows.filter((p) => p.propertyId === parseInt(propertyId as string));
    if (guestId) rows = rows.filter((p) => p.guestId === parseInt(guestId as string));
    if (status) rows = rows.filter((p) => p.status === status);
    res.json(rows.map((p) => ({
      ...p,
      amount: Number(p.amount),
      discount: p.discount ? Number(p.discount) : null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list payments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/payments", async (req, res) => {
  try {
    const { guestId, propertyId, amount, month, year, status, paidAt, method, upiRef, discount, notes } = req.body;
    if (!guestId || !propertyId || !amount || !month || !year) {
      return res.status(400).json({ error: "guestId, propertyId, amount, month, year required" });
    }
    const [payment] = await db.insert(paymentsTable).values({
      guestId, propertyId, amount: amount.toString(), month, year,
      status: status ?? "pending", paidAt: paidAt ? new Date(paidAt) : undefined,
      method, upiRef, discount: discount?.toString(), notes,
    }).returning();

    const [guest] = await db.select({ name: guestsTable.name }).from(guestsTable).where(eq(guestsTable.id, guestId));
    const [prop] = await db.select({ name: propertiesTable.name }).from(propertiesTable).where(eq(propertiesTable.id, propertyId));
    await logActivity("payment", "payment", payment.id, `Payment recorded for ${guest?.name ?? "guest"} — ₹${amount}`, propertyId, prop?.name);

    res.status(201).json({ ...payment, amount: Number(payment.amount), discount: payment.discount ? Number(payment.discount) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to create payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payments/overdue", async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const rows = await db
      .select({
        id: paymentsTable.id,
        guestId: paymentsTable.guestId,
        amount: paymentsTable.amount,
        month: paymentsTable.month,
        year: paymentsTable.year,
        guestName: guestsTable.name,
        guestPhone: guestsTable.phone,
        propertyName: propertiesTable.name,
      })
      .from(paymentsTable)
      .innerJoin(guestsTable, eq(paymentsTable.guestId, guestsTable.id))
      .innerJoin(propertiesTable, eq(paymentsTable.propertyId, propertiesTable.id))
      .where(and(
        eq(paymentsTable.status, "overdue"),
        eq(guestsTable.status, "active")
      ));

    res.json(rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      daysOverdue: Math.max(0, Math.floor((now.getTime() - new Date(r.year, r.month - 1, 1).getTime()) / (1000 * 60 * 60 * 24))),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list overdue payments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id));
    if (!payment) return res.status(404).json({ error: "Not found" });
    res.json({ ...payment, amount: Number(payment.amount), discount: payment.discount ? Number(payment.discount) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to get payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, status, paidAt, method, upiRef, discount, notes } = req.body;
    const [payment] = await db.update(paymentsTable).set({
      amount: amount?.toString(),
      status,
      paidAt: paidAt ? new Date(paidAt) : undefined,
      method,
      upiRef,
      discount: discount?.toString(),
      notes,
    }).where(eq(paymentsTable.id, id)).returning();
    if (!payment) return res.status(404).json({ error: "Not found" });
    res.json({ ...payment, amount: Number(payment.amount), discount: payment.discount ? Number(payment.discount) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to update payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
