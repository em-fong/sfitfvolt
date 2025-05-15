import { eq } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  volunteers, type Volunteer, type InsertVolunteer
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
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }
  
  async upsertUser(userData: { username: string; password: string; email?: string; firstName?: string; lastName?: string; profileImageUrl?: string }): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUserByUsername(userData.username);
    
    if (existingUser) {
      // Update user
      const [updatedUser] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.username, userData.username))
        .returning();
      
      return updatedUser;
    } else {
      // Create user
      return this.createUser({
        username: userData.username,
        password: userData.password
      });
    }
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
}