import { Router } from "express";
import { db, propertiesTable, bedsTable, checkinTokensTable, guestsTable, roomsTable, floorsTable, buildingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { logActivity } from "./activity";

const router = Router();

// Generate a check-in link token (operator)
router.post("/checkin/generate", async (req, res) => {
  const { propertyId, bedId } = req.body;
  if (!propertyId) {
    res.status(400).json({ error: "propertyId is required" });
    return;
  }
  try {
    const token = randomBytes(18).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [row] = await db.insert(checkinTokensTable).values({
      token,
      propertyId: Number(propertyId),
      bedId: bedId ? Number(bedId) : null,
      expiresAt,
    }).returning();

    res.status(201).json({ id: row.id, token: row.token, expiresAt: row.expiresAt });
  } catch (err) {
    req.log.error(err, "Failed to generate checkin token");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Operator: list pending/submitted registrations
router.get("/checkin/submissions", async (req, res) => {
  try {
    const rows = await db.select().from(checkinTokensTable)
      .orderBy(checkinTokensTable.createdAt);

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const [prop] = await db.select({ name: propertiesTable.name })
          .from(propertiesTable).where(eq(propertiesTable.id, row.propertyId));
        return {
          ...row,
          propertyName: prop?.name ?? "Unknown",
          guestName: (row.submittedData as any)?.fullName ?? null,
          guestPhone: (row.submittedData as any)?.phone ?? null,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    req.log.error(err, "Failed to list submissions");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Operator: approve a registration
router.post("/checkin/submissions/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [row] = await db.select().from(checkinTokensTable).where(eq(checkinTokensTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    if (row.status !== "submitted") {
      res.status(400).json({ error: "Submission is not in submitted state." });
      return;
    }

    const data = row.submittedData as any;
    const { bedId: overrideBedId } = req.body;
    const finalBedId = overrideBedId ? Number(overrideBedId) : (data.selectedBedId ? Number(data.selectedBedId) : row.bedId);

    if (!finalBedId) {
      res.status(400).json({ error: "A bed must be assigned before approval." });
      return;
    }

    await db.update(bedsTable).set({ status: "occupied" }).where(eq(bedsTable.id, finalBedId));

    const [guest] = await db.insert(guestsTable).values({
      name: data.fullName,
      phone: data.phone,
      email: data.email ?? null,
      aadhaar: data.aadhaar ?? null,
      emergencyContact: data.emergencyName ?? null,
      emergencyPhone: data.emergencyPhone ?? null,
      occupation: data.occupation ?? null,
      hometown: data.currentAddress ?? null,
      bedId: finalBedId,
      propertyId: row.propertyId,
      checkInDate: data.checkInDate ?? new Date().toISOString().split("T")[0],
      checkOutDate: data.checkOutDate ?? null,
      monthlyRent: String(data.monthlyRent ?? "0"),
      depositAmount: data.depositAmount ? String(data.depositAmount) : null,
      status: "active",
      notes: `Booked via: ${data.bookingSource ?? "self-check-in portal"}. Stay type: ${data.stayType ?? "monthly"}.`,
    }).returning();

    await db.update(checkinTokensTable).set({ status: "approved" }).where(eq(checkinTokensTable.id, row.id));

    const [prop] = await db.select({ name: propertiesTable.name })
      .from(propertiesTable).where(eq(propertiesTable.id, row.propertyId));
    await logActivity("check_in", "guest", guest.id, `${guest.name} approved via self check-in portal`, row.propertyId, prop?.name);

    res.json({
      ...guest,
      monthlyRent: Number(guest.monthlyRent),
      depositAmount: guest.depositAmount ? Number(guest.depositAmount) : null,
    });
  } catch (err) {
    req.log.error(err, "Failed to approve submission");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Operator: reject a registration
router.post("/checkin/submissions/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [row] = await db.select().from(checkinTokensTable).where(eq(checkinTokensTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    await db.update(checkinTokensTable)
      .set({ status: "rejected", notes: req.body.reason ?? null })
      .where(eq(checkinTokensTable.id, id));

    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "Failed to reject submission");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public: get property info for a token
router.get("/checkin/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const [row] = await db.select().from(checkinTokensTable).where(eq(checkinTokensTable.token, token));
    if (!row) {
      res.status(404).json({ error: "Invalid or expired check-in link." });
      return;
    }
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      res.status(410).json({ error: "This check-in link has expired. Please request a new one." });
      return;
    }
    if (row.status === "approved") {
      res.status(409).json({ error: "This check-in link has already been used and approved." });
      return;
    }

    const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, row.propertyId));
    if (!prop) {
      res.status(404).json({ error: "Property not found." });
      return;
    }

    let assignedBed: { bedId: number; bedLabel: string; roomNumber: string; monthlyRent: number | null } | undefined;
    if (row.bedId) {
      const [bed] = await db.select().from(bedsTable).where(eq(bedsTable.id, row.bedId));
      if (bed) {
        const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, bed.roomId));
        assignedBed = {
          bedId: bed.id,
          bedLabel: bed.label,
          roomNumber: room?.number ?? "?",
          monthlyRent: bed.monthlyRent ? Number(bed.monthlyRent) : null,
        };
      }
    }

    // Get available beds for self-selection (if no bed pre-assigned)
    let availableBeds: any[] = [];
    if (!row.bedId) {
      availableBeds = await db
        .select({
          id: bedsTable.id,
          label: bedsTable.label,
          monthlyRent: bedsTable.monthlyRent,
          roomNumber: roomsTable.number,
          roomId: roomsTable.id,
          floorName: floorsTable.name,
          buildingName: buildingsTable.name,
        })
        .from(bedsTable)
        .innerJoin(roomsTable, eq(bedsTable.roomId, roomsTable.id))
        .innerJoin(floorsTable, eq(roomsTable.floorId, floorsTable.id))
        .innerJoin(buildingsTable, eq(floorsTable.buildingId, buildingsTable.id))
        .where(
          and(
            eq(buildingsTable.propertyId, row.propertyId),
            eq(bedsTable.status, "available")
          )
        )
        .orderBy(buildingsTable.name, floorsTable.number, roomsTable.number, bedsTable.label);

      availableBeds = availableBeds.map((b) => ({
        ...b,
        monthlyRent: b.monthlyRent ? Number(b.monthlyRent) : null,
      }));
    }

    res.json({
      name: prop.name,
      address: prop.address,
      city: prop.city,
      state: prop.state,
      phone: prop.phone ?? null,
      type: prop.type,
      propertyId: prop.id,
      assignedBed,
      availableBeds,
    });
  } catch (err) {
    req.log.error(err, "Failed to fetch checkin info");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public: submit guest registration
router.post("/checkin/:token/submit", async (req, res) => {
  const { token } = req.params;
  try {
    const [row] = await db.select().from(checkinTokensTable).where(eq(checkinTokensTable.token, token));
    if (!row) {
      res.status(404).json({ error: "Invalid check-in link." });
      return;
    }
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      res.status(410).json({ error: "This check-in link has expired." });
      return;
    }
    if (row.status === "approved") {
      res.status(409).json({ error: "This link has already been approved." });
      return;
    }

    await db.update(checkinTokensTable)
      .set({ status: "submitted", submittedData: req.body })
      .where(eq(checkinTokensTable.id, row.id));

    res.json({ success: true, message: "Registration submitted. Awaiting approval." });
  } catch (err) {
    req.log.error(err, "Failed to submit checkin");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
