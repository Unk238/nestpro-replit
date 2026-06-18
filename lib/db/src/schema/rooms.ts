import { pgTable, serial, text, integer, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { floorsTable } from "./floors";

export const roomTypeEnum = pgEnum("room_type", ["single", "double", "triple", "quad", "dormitory"]);

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  floorId: integer("floor_id").notNull().references(() => floorsTable.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  type: roomTypeEnum("type").notNull().default("single"),
  hasAC: boolean("has_ac").notNull().default(false),
  hasAttachedBath: boolean("has_attached_bath").notNull().default(false),
  monthlyRent: numeric("monthly_rent", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
