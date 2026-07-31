import { pgTable, pgEnum, serial, text, integer, timestamp, numeric, date } from 'drizzle-orm/pg-core';
import { beds } from './beds';
import { properties } from './properties';

export const guestStatusEnum = pgEnum('guest_status', ['active', 'checked_out']);

export const guests = pgTable('guests', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  aadhaar: text('aadhaar'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  occupation: text('occupation'),
  hometown: text('hometown'),
  bedId: integer('bed_id').references(() => beds.id),
  propertyId: integer('property_id').references(() => properties.id),
  checkInDate: date('check_in_date'),
  checkOutDate: date('check_out_date'),
  status: guestStatusEnum('status').notNull().default('active'),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }).default('0'),
  depositAmount: numeric('deposit_amount', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
