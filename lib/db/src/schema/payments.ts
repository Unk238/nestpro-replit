import { pgTable, pgEnum, serial, integer, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { guests } from './guests';
import { properties } from './properties';

export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'pending', 'overdue', 'partial']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'upi', 'bank_transfer', 'cheque']);

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  guestId: integer('guest_id').notNull().references(() => guests.id),
  propertyId: integer('property_id').references(() => properties.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  method: paymentMethodEnum('method'),
  upiRef: text('upi_ref'),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
