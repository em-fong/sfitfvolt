import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  volunteers, type Volunteer, type InsertVolunteer
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Volunteer methods
  getVolunteers(eventId: number): Promise<Volunteer[]>;
  getVolunteer(id: number): Promise<Volunteer | undefined>;
  createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer>;
  updateVolunteer(id: number, volunteer: Partial<InsertVolunteer>): Promise<Volunteer | undefined>;
  checkInVolunteer(id: number, checkedInBy: string): Promise<Volunteer | undefined>;
  getEventStats(eventId: number): Promise<{ total: number, checkedIn: number, pending: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private volunteers: Map<number, Volunteer>;
  private userId: number;
  private eventId: number;
  private volunteerId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.volunteers = new Map();
    this.userId = 1;
    this.eventId = 1;
    this.volunteerId = 1;
    
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Add events
    const events: InsertEvent[] = [
      {
        name: "Community Park Cleanup",
        date: "May 15, 2023",
        time: "9:00 AM - 12:00 PM",
        location: "Riverside Park"
      },
      {
        name: "Food Drive",
        date: "May 20, 2023",
        time: "10:00 AM - 2:00 PM",
        location: "Community Center"
      },
      {
        name: "Charity Run",
        date: "June 5, 2023",
        time: "7:00 AM - 10:00 AM",
        location: "Downtown Plaza"
      }
    ];
    
    events.forEach(event => this.createEvent(event));
    
    // Add volunteers for each event
    const volunteers: Array<Omit<InsertVolunteer, "eventId">> = [
      {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        phone: "(555) 123-4567",
        role: "Clean-up Crew",
        team: "North Area",
        shirtSize: "Medium",
        dietaryNeeds: "Vegetarian",
        checkedIn: false,
        checkInTime: undefined,
        checkedInBy: undefined
      },
      {
        name: "Michael Chen",
        email: "michael.c@example.com",
        phone: "(555) 234-5678",
        role: "Team Lead",
        team: "South Area",
        shirtSize: "Large",
        dietaryNeeds: "None",
        checkedIn: true,
        checkInTime: new Date(),
        checkedInBy: "Volunteer Admin"
      },
      {
        name: "Jessica Smith",
        email: "jessica.s@example.com",
        phone: "(555) 345-6789",
        role: "Registration",
        team: "Central Area",
        shirtSize: "Small",
        dietaryNeeds: "Gluten-free",
        checkedIn: false,
        checkInTime: undefined,
        checkedInBy: undefined
      },
      {
        name: "David Rodriguez",
        email: "david.r@example.com",
        phone: "(555) 456-7890",
        role: "Food Distribution",
        team: "Kitchen",
        shirtSize: "XL",
        dietaryNeeds: "None",
        checkedIn: true,
        checkInTime: new Date(),
        checkedInBy: "Volunteer Admin"
      },
      {
        name: "Emily Wilson",
        email: "emily.w@example.com",
        phone: "(555) 567-8901",
        role: "First Aid",
        team: "Medical",
        shirtSize: "Medium",
        dietaryNeeds: "Vegan",
        checkedIn: false,
        checkInTime: undefined,
        checkedInBy: undefined
      }
    ];
    
    // Add volunteers to each event (1, 2, and 3)
    for (let eventId = 1; eventId <= 3; eventId++) {
      volunteers.forEach(volunteer => {
        this.createVolunteer({ ...volunteer, eventId });
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }

  // Volunteer methods
  async getVolunteers(eventId: number): Promise<Volunteer[]> {
    return Array.from(this.volunteers.values()).filter(
      (volunteer) => volunteer.eventId === eventId
    );
  }

  async getVolunteer(id: number): Promise<Volunteer | undefined> {
    return this.volunteers.get(id);
  }

  async createVolunteer(insertVolunteer: InsertVolunteer): Promise<Volunteer> {
    const id = this.volunteerId++;
    const volunteer: Volunteer = { ...insertVolunteer, id };
    this.volunteers.set(id, volunteer);
    return volunteer;
  }

  async updateVolunteer(id: number, updates: Partial<InsertVolunteer>): Promise<Volunteer | undefined> {
    const volunteer = this.volunteers.get(id);
    if (!volunteer) return undefined;

    const updatedVolunteer = { ...volunteer, ...updates };
    this.volunteers.set(id, updatedVolunteer);
    return updatedVolunteer;
  }

  async checkInVolunteer(id: number, checkedInBy: string): Promise<Volunteer | undefined> {
    const volunteer = this.volunteers.get(id);
    if (!volunteer) return undefined;

    const updatedVolunteer = { 
      ...volunteer, 
      checkedIn: true, 
      checkInTime: new Date(),
      checkedInBy
    };
    this.volunteers.set(id, updatedVolunteer);
    return updatedVolunteer;
  }

  async getEventStats(eventId: number): Promise<{ total: number, checkedIn: number, pending: number }> {
    const volunteers = await this.getVolunteers(eventId);
    const total = volunteers.length;
    const checkedIn = volunteers.filter(v => v.checkedIn).length;
    const pending = total - checkedIn;

    return { total, checkedIn, pending };
  }
}

export const storage = new MemStorage();
