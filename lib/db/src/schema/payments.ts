import { pgTable, serial, text, integer, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guestsTable } from "./guests";
import { propertiesTable } from "./properties";

export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "overdue", "partial"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "upi", "bank_transfer", "cheque"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull().references(() => guestsTable.id),
  propertyId: integer("property_id").notNull().references(() => propertiesTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  method: paymentMethodEnum("method"),
  upiRef: text("upi_ref"),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
