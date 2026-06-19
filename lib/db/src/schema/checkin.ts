import { pgTable, serial, text, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { propertiesTable } from "./properties";
import { bedsTable } from "./beds";

export const checkinStatusEnum = pgEnum("checkin_status", ["pending", "submitted", "approved", "rejected"]);

export const checkinTokensTable = pgTable("checkin_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  propertyId: integer("property_id").notNull().references(() => propertiesTable.id, { onDelete: "cascade" }),
  bedId: integer("bed_id").references(() => bedsTable.id),
  status: checkinStatusEnum("status").notNull().default("pending"),
  submittedData: jsonb("submitted_data"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type CheckinToken = typeof checkinTokensTable.$inferSelect;
