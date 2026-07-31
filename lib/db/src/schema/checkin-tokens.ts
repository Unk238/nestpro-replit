import { pgTable, pgEnum, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { properties } from './properties';
import { beds } from './beds';

export const checkinTokenStatusEnum = pgEnum('checkin_token_status', [
  'pending', 'submitted', 'approved', 'rejected',
]);

export const checkinTokens = pgTable('checkin_tokens', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  bedId: integer('bed_id').references(() => beds.id),
  status: checkinTokenStatusEnum('status').notNull().default('pending'),
  submittedData: jsonb('submitted_data'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export type CheckinToken = typeof checkinTokens.$inferSelect;
export type NewCheckinToken = typeof checkinTokens.$inferInsert;
