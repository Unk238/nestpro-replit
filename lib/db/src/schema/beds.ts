import { pgTable, serial, text, integer, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { roomsTable } from "./rooms";

export const bedStatusEnum = pgEnum("bed_status", ["available", "occupied", "maintenance", "reserved"]);

export const bedsTable = pgTable("beds", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  status: bedStatusEnum("status").notNull().default("available"),
  monthlyRent: numeric("monthly_rent", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBedSchema = createInsertSchema(bedsTable).omit({ id: true, createdAt: true });
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof bedsTable.$inferSelect;
