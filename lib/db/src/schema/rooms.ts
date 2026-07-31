import { pgTable, pgEnum, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { floors } from './floors';

export const roomTypeEnum = pgEnum('room_type', ['single', 'double', 'triple', 'quad', 'dormitory']);

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  floorId: integer('floor_id').notNull().references(() => floors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: roomTypeEnum('type').notNull().default('single'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
