import { pgTable, pgEnum, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { properties } from './properties';

export const staffRoleEnum = pgEnum('staff_role', [
  'owner', 'manager', 'landlord', 'operations_manager', 'receptionist', 'staff', 'broker', 'admin'
]);

export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: staffRoleEnum('role').notNull().default('staff'),
  permissions: text('permissions'), // JSON string array of permission codes
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
