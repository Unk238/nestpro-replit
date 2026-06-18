import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { buildingsTable } from "./buildings";

export const floorsTable = pgTable("floors", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").notNull().references(() => buildingsTable.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFloorSchema = createInsertSchema(floorsTable).omit({ id: true, createdAt: true });
export type InsertFloor = z.infer<typeof insertFloorSchema>;
export type Floor = typeof floorsTable.$inferSelect;
