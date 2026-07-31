import { pgTable, pgEnum, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const staffRoleEnum = pgEnum('staff_role', ['owner', 'manager', 'operator']);

export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: staffRoleEnum('role').notNull().default('operator'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
