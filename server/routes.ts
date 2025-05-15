import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertEventSchema, insertShiftSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      
      // Add volunteer count to each event
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          const volunteers = await storage.getVolunteers(event.id);
          return {
            ...event,
            volunteerCount: volunteers.length
          };
        })
      );
      
      res.json(eventsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(Number(req.params.id));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.get("/api/events/:id/stats", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const stats = await storage.getEventStats(eventId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event stats" });
    }
  });

  app.get("/api/events/:id/volunteers", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const volunteers = await storage.getVolunteers(eventId);
      res.json(volunteers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch volunteers" });
    }
  });

  app.get("/api/volunteers/:id", async (req, res) => {
    try {
      const volunteer = await storage.getVolunteer(Number(req.params.id));
      if (!volunteer) {
        return res.status(404).json({ message: "Volunteer not found" });
      }
      
      res.json(volunteer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch volunteer" });
    }
  });

  app.post("/api/volunteers/:id/check-in", async (req, res) => {
    try {
      const schema = z.object({
        checkedInBy: z.string()
      });
      
      const parsedBody = schema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      const { checkedInBy } = parsedBody.data;
      const volunteerId = Number(req.params.id);
      
      const updatedVolunteer = await storage.checkInVolunteer(volunteerId, checkedInBy);
      if (!updatedVolunteer) {
        return res.status(404).json({ message: "Volunteer not found" });
      }
      
      res.json(updatedVolunteer);
    } catch (error) {
      res.status(500).json({ message: "Failed to check in volunteer" });
    }
  });
  
  app.post("/api/events", async (req, res) => {
    try {
      const parsedBody = insertEventSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid event data", 
          errors: parsedBody.error.errors 
        });
      }
      
      const eventData = parsedBody.data;
      const newEvent = await storage.createEvent(eventData);
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Shifts endpoints
  app.get("/api/events/:eventId/shifts", async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const shifts = await storage.getShifts(eventId);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/events/:eventId/shifts/date/:date", async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const dateStr = req.params.date; // Expected format: YYYY-MM-DD
      const shiftDate = new Date(dateStr);
      
      if (isNaN(shiftDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const shifts = await storage.getShiftsByDate(eventId, shiftDate);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts by date:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/shifts/:id", async (req, res) => {
    try {
      const shift = await storage.getShift(Number(req.params.id));
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      res.json(shift);
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ message: "Failed to fetch shift" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const parsedBody = insertShiftSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid shift data", 
          errors: parsedBody.error.errors 
        });
      }
      
      const shiftData = parsedBody.data;
      const newShift = await storage.createShift(shiftData);
      
      res.status(201).json(newShift);
    } catch (error) {
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  app.put("/api/shifts/:id", async (req, res) => {
    try {
      const shiftId = Number(req.params.id);
      const parsedBody = insertShiftSchema.partial().safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid shift data", 
          errors: parsedBody.error.errors 
        });
      }
      
      const shiftData = parsedBody.data;
      const updatedShift = await storage.updateShift(shiftId, shiftData);
      
      if (!updatedShift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      res.json(updatedShift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const shiftId = Number(req.params.id);
      const deleted = await storage.deleteShift(shiftId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
