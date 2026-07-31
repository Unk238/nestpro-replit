import { pgTable, pgEnum, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { guests } from './guests';
import { properties } from './properties';

export const complaintCategoryEnum = pgEnum('complaint_category', [
  'maintenance', 'cleanliness', 'noise', 'security', 'food', 'internet', 'other',
]);
export const complaintStatusEnum = pgEnum('complaint_status', [
  'pending', 'assigned', 'in_progress', 'resolved', 'closed',
]);
export const complaintPriorityEnum = pgEnum('complaint_priority', ['low', 'medium', 'high', 'urgent']);

export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  guestId: integer('guest_id').references(() => guests.id),
  propertyId: integer('property_id').references(() => properties.id),
  title: text('title').notNull(),
  description: text('description'),
  category: complaintCategoryEnum('category').notNull().default('other'),
  status: complaintStatusEnum('status').notNull().default('pending'),
  priority: complaintPriorityEnum('priority').notNull().default('medium'),
  assignedTo: integer('assigned_to'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;
