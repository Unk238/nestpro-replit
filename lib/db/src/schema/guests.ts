import { pgTable, serial, text, integer, timestamp, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bedsTable } from "./beds";
import { propertiesTable } from "./properties";

export const guestStatusEnum = pgEnum("guest_status", ["active", "checked_out"]);

export const guestsTable = pgTable("guests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  aadhaar: text("aadhaar"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  occupation: text("occupation"),
  hometown: text("hometown"),
  bedId: integer("bed_id").notNull().references(() => bedsTable.id),
  propertyId: integer("property_id").notNull().references(() => propertiesTable.id),
  checkInDate: date("check_in_date", { mode: "string" }).notNull(),
  checkOutDate: date("check_out_date", { mode: "string" }),
  status: guestStatusEnum("status").notNull().default("active"),
  monthlyRent: numeric("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guestsTable).omit({ id: true, createdAt: true });
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guestsTable.$inferSelect;
