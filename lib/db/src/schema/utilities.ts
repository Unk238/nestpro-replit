import { pgTable, pgEnum, serial, text, integer, timestamp, numeric, date } from 'drizzle-orm/pg-core';
import { properties } from './properties';

export const utilityTypeEnum = pgEnum('utility_type', ['electricity', 'water', 'internet', 'generator', 'gas', 'other']);
export const splitMethodEnum = pgEnum('split_method', ['equal', 'per_room', 'per_bed', 'by_days', 'custom']);

export const utilityMeters = pgTable('utility_meters', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  meterNumber: text('meter_number').notNull(),
  label: text('label').notNull(), // e.g. "Main Block 1 Meter", "Floor 2 AC Meter"
  type: utilityTypeEnum('type').notNull().default('electricity'),
  unitRate: numeric('unit_rate', { precision: 10, scale: 2 }).default('9.50'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const utilityBills = pgTable('utility_bills', {
  id: serial('id').primaryKey(),
  meterId: integer('meter_id').notNull().references(() => utilityMeters.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  billingMonth: integer('billing_month').notNull(),
  billingYear: integer('billing_year').notNull(),
  previousReading: numeric('previous_reading', { precision: 10, scale: 2 }).notNull(),
  currentReading: numeric('current_reading', { precision: 10, scale: 2 }).notNull(),
  unitsConsumed: numeric('units_consumed', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  splitMethod: splitMethodEnum('split_method').notNull().default('equal'),
  status: text('status').default('calculated'), // 'calculated' | 'billed' | 'collected'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type UtilityMeter = typeof utilityMeters.$inferSelect;
export type UtilityBill = typeof utilityBills.$inferSelect;
