import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  volunteers, type Volunteer, type InsertVolunteer,
  shifts, type Shift, type InsertShift,
  roles, type Role, type InsertRole,
  shiftRoles, type ShiftRole, type InsertShiftRole
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  // Volunteer methods
  async getVolunteers(eventId: number): Promise<Volunteer[]> {
    return await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.eventId, eventId));
  }

  async getVolunteer(id: number): Promise<Volunteer | undefined> {
    const [volunteer] = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.id, id));
    return volunteer || undefined;
  }

  async createVolunteer(insertVolunteer: InsertVolunteer): Promise<Volunteer> {
    const [volunteer] = await db
      .insert(volunteers)
      .values(insertVolunteer)
      .returning();
    return volunteer;
  }

  async updateVolunteer(id: number, updates: Partial<InsertVolunteer>): Promise<Volunteer | undefined> {
    const [updatedVolunteer] = await db
      .update(volunteers)
      .set(updates)
      .where(eq(volunteers.id, id))
      .returning();
    
    return updatedVolunteer || undefined;
  }

  async checkInVolunteer(id: number, checkedInBy: string): Promise<Volunteer | undefined> {
    return this.updateVolunteer(id, {
      checkedIn: true,
      checkInTime: new Date(),
      checkedInBy
    });
  }

  async getEventStats(eventId: number): Promise<{ total: number, checkedIn: number, pending: number }> {
    const volunteersForEvent = await this.getVolunteers(eventId);
    const total = volunteersForEvent.length;
    const checkedIn = volunteersForEvent.filter(v => v.checkedIn).length;
    const pending = total - checkedIn;

    return { total, checkedIn, pending };
  }

  // Shift methods
  async getShifts(eventId: number): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.eventId, eventId));
  }

  async getShift(id: number): Promise<Shift | undefined> {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id));
    return shift || undefined;
  }

  async getShiftsByDate(eventId: number, shiftDate: Date): Promise<Shift[]> {
    // Convert the date to a string in YYYY-MM-DD format
    const formattedDate = shiftDate.toISOString().split('T')[0];
    
    // Get all shifts for the event
    const allShifts = await db
      .select()
      .from(shifts)
      .where(eq(shifts.eventId, eventId));
    
    // Filter by the date (manual filtering as a workaround for date comparison issues)
    return allShifts.filter(shift => {
      const shiftDateStr = new Date(shift.shiftDate).toISOString().split('T')[0];
      return shiftDateStr === formattedDate;
    });
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const [shift] = await db
      .insert(shifts)
      .values(insertShift)
      .returning();
    return shift;
  }

  async updateShift(id: number, updates: Partial<InsertShift>): Promise<Shift | undefined> {
    const [updatedShift] = await db
      .update(shifts)
      .set(updates)
      .where(eq(shifts.id, id))
      .returning();
    
    return updatedShift || undefined;
  }

  async deleteShift(id: number): Promise<boolean> {
    const [deletedShift] = await db
      .delete(shifts)
      .where(eq(shifts.id, id))
      .returning();
    
    return !!deletedShift;
  }
  
  // Role methods
  async getRoles(eventId: number): Promise<Role[]> {
    return db.select().from(roles).where(eq(roles.eventId, eventId));
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async updateRole(id: number, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, id))
      .returning();
    
    return updatedRole || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    // First delete any shift role associations
    await db
      .delete(shiftRoles)
      .where(eq(shiftRoles.roleId, id));
      
    // Then delete the role
    const [deletedRole] = await db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning();
    
    return !!deletedRole;
  }
  
  // ShiftRole methods
  async getShiftRoles(shiftId: number): Promise<(ShiftRole & { role: Role })[]> {
    // Get all shift-role associations for this shift
    const shiftRoleEntries = await db
      .select()
      .from(shiftRoles)
      .where(eq(shiftRoles.shiftId, shiftId));
    
    // Create an array to store the result with role information
    const result: (ShiftRole & { role: Role })[] = [];
    
    // For each shift-role, fetch the associated role and combine the data
    for (const sr of shiftRoleEntries) {
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, sr.roleId));
      
      if (role) {
        result.push({
          ...sr,
          role
        });
      }
    }
    
    return result;
  }

  async assignRoleToShift(insertShiftRole: InsertShiftRole): Promise<ShiftRole> {
    // Check if this role is already assigned to this shift
    const existing = await db
      .select()
      .from(shiftRoles)
      .where(and(
        eq(shiftRoles.shiftId, insertShiftRole.shiftId),
        eq(shiftRoles.roleId, insertShiftRole.roleId)
      ));
    
    // If it exists, return the existing entry
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Otherwise, create a new assignment
    const [shiftRole] = await db
      .insert(shiftRoles)
      .values(insertShiftRole)
      .returning();
    
    return shiftRole;
  }

  async removeRoleFromShift(shiftId: number, roleId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(shiftRoles)
      .where(and(
        eq(shiftRoles.shiftId, shiftId),
        eq(shiftRoles.roleId, roleId)
      ))
      .returning();
    
    return !!deleted;
  }
}