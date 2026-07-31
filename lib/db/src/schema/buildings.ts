import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { properties } from './properties';

export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  totalFloors: integer('total_floors').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Building = typeof buildings.$inferSelect;
export type NewBuilding = typeof buildings.$inferInsert;
