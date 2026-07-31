import { Router } from 'express';
import { db, activityLogs } from '@workspace/db';
import { eq, sql } from 'drizzle-orm';

const router = Router();

router.get('/activity', async (req, res) => {
  const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

  const rows = await db.select().from(activityLogs)
    .where(propertyId ? eq(activityLogs.propertyId, propertyId) : undefined)
    .orderBy(sql`${activityLogs.createdAt} desc`)
    .limit(limit);
  res.json(rows);
});

export default router;
