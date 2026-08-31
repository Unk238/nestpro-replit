import { pgTable, pgEnum, serial, text, integer, timestamp, numeric, date } from 'drizzle-orm/pg-core';
import { properties } from './properties';
import { rooms } from './rooms';
import { guests } from './guests';

export const bookingSourceEnum = pgEnum('booking_source', [
  'direct', 'booking_com', 'airbnb', 'agoda', 'makemytrip', 'expedia', 'yatra', 'phone', 'other'
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'confirmed', 'in_review', 'checked_in', 'extended', 'checked_out', 'cancelled'
]);

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  roomId: integer('room_id').references(() => rooms.id),
  guestId: integer('guest_id').references(() => guests.id),
  guestName: text('guest_name').notNull(),
  guestPhone: text('guest_phone'),
  guestEmail: text('guest_email'),
  source: bookingSourceEnum('source').notNull().default('direct'),
  externalBookingId: text('external_booking_id'),
  checkInDate: date('check_in_date').notNull(),
  checkOutDate: date('check_out_date').notNull(),
  status: bookingStatusEnum('status').notNull().default('confirmed'),
  grossAmount: numeric('gross_amount', { precision: 10, scale: 2 }).notNull(),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).default('0'),
  netReceivable: numeric('net_receivable', { precision: 10, scale: 2 }).notNull(),
  amountReceived: numeric('amount_received', { precision: 10, scale: 2 }).default('0'),
  settlementStatus: text('settlement_status').default('pending'), // 'settled' | 'pending' | 'disputed'
  isExtension: text('is_extension').default('no'),
  originalBookingId: integer('original_booking_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
