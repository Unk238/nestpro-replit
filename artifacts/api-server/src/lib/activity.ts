import { db, activityLogs } from '@workspace/db';

export async function logActivity(data: {
  action: string;
  entity: string;
  entityId?: number;
  description: string;
  propertyId?: number;
  propertyName?: string;
}) {
  try {
    await db.insert(activityLogs).values({
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      description: data.description,
      propertyId: data.propertyId,
      propertyName: data.propertyName,
    });
  } catch (_err) {
    // best-effort — never blocks primary operation
  }
}
