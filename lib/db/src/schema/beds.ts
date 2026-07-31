import { pgTable, pgEnum, serial, text, integer, timestamp, numeric } from 'drizzle-orm/pg-core';
import { rooms } from './rooms';

export const bedStatusEnum = pgEnum('bed_status', ['available', 'occupied', 'maintenance', 'reserved']);

export const beds = pgTable('beds', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  status: bedStatusEnum('status').notNull().default('available'),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Bed = typeof beds.$inferSelect;
export type NewBed = typeof beds.$inferInsert;
