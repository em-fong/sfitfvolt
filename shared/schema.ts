import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  volunteers: many(volunteers),
}));

export const insertEventSchema = createInsertSchema(events).pick({
  name: true,
  date: true,
  time: true,
  location: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Volunteers schema
export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role"),
  team: text("team"),
  shirtSize: text("shirt_size"),
  dietaryNeeds: text("dietary_needs"),
  eventId: integer("event_id").notNull(),
  checkedIn: boolean("checked_in").default(false),
  checkInTime: timestamp("check_in_time"),
  checkedInBy: text("checked_in_by"),
});

export const volunteersRelations = relations(volunteers, ({ one }) => ({
  event: one(events, {
    fields: [volunteers.eventId],
    references: [events.id],
  }),
}));

export const insertVolunteerSchema = createInsertSchema(volunteers).pick({
  name: true,
  email: true,
  phone: true,
  role: true,
  team: true,
  shirtSize: true,
  dietaryNeeds: true,
  eventId: true,
  checkedIn: true,
  checkInTime: true,
  checkedInBy: true,
});

export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;
export type Volunteer = typeof volunteers.$inferSelect;
