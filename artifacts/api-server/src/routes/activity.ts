import { Router } from "express";
import { db, activityLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

export async function logActivity(
  action: string,
  entity: string,
  entityId?: number,
  description?: string,
  propertyId?: number,
  propertyName?: string
) {
  try {
    await db.insert(activityLogsTable).values({
      action,
      entity,
      entityId,
      description: description ?? `${action} ${entity}`,
      propertyId,
      propertyName,
    });
  } catch {
    // silently swallow logging errors
  }
}

router.get("/activity", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "50");
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;

    let query = db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt)).limit(limit);
    const rows = await query;
    const filtered = propertyId ? rows.filter((r) => r.propertyId === propertyId || r.propertyId == null) : rows;
    res.json(filtered);
  } catch (err) {
    req.log.error({ err }, "Failed to list activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
