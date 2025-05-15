import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  volunteers, type Volunteer, type InsertVolunteer,
  shifts, type Shift, type InsertShift
} from "@shared/schema";
import { DatabaseStorage } from "./databaseStorage";

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
  
  // Shift methods
  getShifts(eventId: number): Promise<Shift[]>;
  getShift(id: number): Promise<Shift | undefined>;
  getShiftsByDate(eventId: number, shiftDate: Date): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;
}

// Seed demo data
async function seedDemoData(storage: IStorage) {
  console.log("Seeding demo data...");
  
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
  
  // Create events and store them
  const createdEvents = await Promise.all(events.map(event => storage.createEvent(event)));
  
  // Add volunteers for each event
  const volunteerTemplates = [
    {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "(555) 123-4567",
      role: "Clean-up Crew",
      team: "North Area",
      shirtSize: "Medium",
      dietaryNeeds: "Vegetarian",
      checkedIn: false,
      checkInTime: null,
      checkedInBy: null
    },
    {
      name: "Michael Chen",
      email: "michael.c@example.com",
      phone: "(555) 234-5678",
      role: "Team Lead",
      team: "South Area",
      shirtSize: "Large",
      dietaryNeeds: "None",
      checkedIn: false,
      checkInTime: null,
      checkedInBy: null
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
      checkInTime: null,
      checkedInBy: null
    },
    {
      name: "David Rodriguez",
      email: "david.r@example.com",
      phone: "(555) 456-7890",
      role: "Food Distribution",
      team: "Kitchen",
      shirtSize: "XL",
      dietaryNeeds: "None",
      checkedIn: false,
      checkInTime: null,
      checkedInBy: null
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
      checkInTime: null,
      checkedInBy: null
    }
  ];
  
  // Add volunteers to each event
  for (const event of createdEvents) {
    await Promise.all(
      volunteerTemplates.map(volunteerData => 
        storage.createVolunteer({ ...volunteerData, eventId: event.id })
      )
    );
  }
  
  console.log("Demo data seeded successfully");
}

// Initialize database storage
export const storage = new DatabaseStorage();

// Set up to seed data (to be called when server starts)
export async function initializeStorage() {
  try {
    // Check if we need to seed data
    const events = await storage.getEvents();
    
    if (events.length === 0) {
      await seedDemoData(storage);
    } else {
      console.log("Database already contains data, skipping seed");
    }
  } catch (error) {
    console.error("Error during storage initialization:", error);
  }
}
