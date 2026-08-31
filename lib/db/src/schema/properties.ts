import { pgTable, pgEnum, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const propertyTypeEnum = pgEnum('property_type', [
  'pg', 'hostel', 'hotel', 'villa', 'apartment', 'kothi', 'shop', 'office', 'library', 'co_living', 'other'
]);

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  type: propertyTypeEnum('type').notNull().default('pg'),
  description: text('description'),
  amenities: text('amenities'), // JSON string of amenities list
  rules: text('rules'), // House rules text/json
  wifiSsid: text('wifi_ssid'),
  wifiPassword: text('wifi_password'),
  upiId: text('upi_id'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  websiteSlug: text('website_slug'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
