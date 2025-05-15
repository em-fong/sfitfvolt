import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth middleware and routes
  await setupAuth(app);
  
  // API routes - protected by auth
  app.get("/api/events", isAuthenticated, async (req, res) => {
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

  app.get("/api/events/:id", isAuthenticated, async (req, res) => {
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

  app.get("/api/events/:id/stats", isAuthenticated, async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const stats = await storage.getEventStats(eventId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event stats" });
    }
  });

  app.get("/api/events/:id/volunteers", isAuthenticated, async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const volunteers = await storage.getVolunteers(eventId);
      res.json(volunteers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch volunteers" });
    }
  });

  app.get("/api/volunteers/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/volunteers/:id/check-in", isAuthenticated, async (req: any, res) => {
    try {
      // Get the current user from the session
      const userId = req.user.claims.sub;
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized user" });
      }
      
      // Use authenticated user's info for checkedInBy
      const userName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : (user.username || "Admin");
      
      const volunteerId = Number(req.params.id);
      
      const updatedVolunteer = await storage.checkInVolunteer(volunteerId, userName);
      if (!updatedVolunteer) {
        return res.status(404).json({ message: "Volunteer not found" });
      }
      
      res.json(updatedVolunteer);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Failed to check in volunteer" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
