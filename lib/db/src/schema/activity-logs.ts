import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: integer('entity_id'),
  description: text('description').notNull(),
  propertyId: integer('property_id'),
  propertyName: text('property_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
