import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
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
  rawDates: text("raw_dates"), // Store ISO dates in pipe-separated format for precise parsing
});

// This will be defined after all tables are declared
let eventsRelationsTemp: any;

export const insertEventSchema = createInsertSchema(events).pick({
  name: true,
  date: true,
  time: true,
  location: true,
  rawDates: true,
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

// Shifts schema
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  shiftDate: date("shift_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  maxVolunteers: integer("max_volunteers").default(0),
});

// Will define this after all tables are declared
let shiftsRelationsTemp: any;

export const insertShiftSchema = createInsertSchema(shifts).pick({
  eventId: true,
  shiftDate: true,
  startTime: true,
  endTime: true,
  title: true,
  description: true,
  maxVolunteers: true,
});

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// Roles schema
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
});

// Will define this after all tables are declared
let rolesRelationsTemp: any;

export const insertRoleSchema = createInsertSchema(roles).pick({
  eventId: true,
  name: true,
  description: true,
});

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// ShiftRoles join table to associate roles with shifts
export const shiftRoles = pgTable("shift_roles", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull(),
  roleId: integer("role_id").notNull(),
});

export const shiftRolesRelations = relations(shiftRoles, ({ one }) => ({
  shift: one(shifts, {
    fields: [shiftRoles.shiftId],
    references: [shifts.id],
  }),
  role: one(roles, {
    fields: [shiftRoles.roleId],
    references: [roles.id],
  }),
}));

export const insertShiftRoleSchema = createInsertSchema(shiftRoles).pick({
  shiftId: true,
  roleId: true,
});

export type InsertShiftRole = z.infer<typeof insertShiftRoleSchema>;
export type ShiftRole = typeof shiftRoles.$inferSelect;

// Now we can define all relations after all tables are declared
export const eventsRelations = relations(events, ({ many }) => ({
  volunteers: many(volunteers),
  shifts: many(shifts),
  roles: many(roles),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  event: one(events, {
    fields: [shifts.eventId],
    references: [events.id],
  }),
  shiftRoles: many(shiftRoles),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  event: one(events, {
    fields: [roles.eventId],
    references: [events.id],
  }),
  shiftRoles: many(shiftRoles),
}));
