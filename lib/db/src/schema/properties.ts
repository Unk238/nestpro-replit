import { pgTable, pgEnum, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const propertyTypeEnum = pgEnum('property_type', [
  'pg', 'hostel', 'apartment', 'villa', 'co_living',
]);

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  type: propertyTypeEnum('type').notNull().default('pg'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
