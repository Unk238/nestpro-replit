import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guestsTable } from "./guests";
import { propertiesTable } from "./properties";
import { staffTable } from "./staff";

export const complaintCategoryEnum = pgEnum("complaint_category", [
  "maintenance", "cleanliness", "security", "noise", "wifi", "water", "electricity", "food", "other"
]);
export const complaintStatusEnum = pgEnum("complaint_status", ["pending", "assigned", "in_progress", "resolved", "closed"]);
export const complaintPriorityEnum = pgEnum("complaint_priority", ["low", "medium", "high", "urgent"]);

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull().references(() => guestsTable.id),
  propertyId: integer("property_id").notNull().references(() => propertiesTable.id),
  title: text("title").notNull(),
  description: text("description"),
  category: complaintCategoryEnum("category").notNull().default("other"),
  status: complaintStatusEnum("status").notNull().default("pending"),
  priority: complaintPriorityEnum("priority").notNull().default("medium"),
  assignedTo: integer("assigned_to").references(() => staffTable.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, createdAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
