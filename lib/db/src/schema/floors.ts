import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { buildings } from './buildings';

export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  floorNumber: integer('floor_number').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Floor = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;
