import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertEventSchema, insertShiftSchema, insertRoleSchema, insertShiftRoleSchema } from "../shared/schema";

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
      
      // Sort shifts by date and time
      shifts.sort((a, b) => {
        const dateCompare = new Date(a.shiftDate).getTime() - new Date(b.shiftDate).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // If same date, sort by start time
        return a.startTime.localeCompare(b.startTime);
      });
      
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
  
  // Role endpoints
  app.get("/api/events/:eventId/roles", async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const roles = await storage.getRoles(eventId);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });
  
  app.get("/api/roles/:id", async (req, res) => {
    try {
      const roleId = Number(req.params.id);
      const role = await storage.getRole(roleId);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });
  
  app.post("/api/roles", async (req, res) => {
    try {
      const parsedBody = insertRoleSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid role data", 
          errors: parsedBody.error.errors 
        });
      }
      
      const roleData = parsedBody.data;
      const newRole = await storage.createRole(roleData);
      
      res.status(201).json(newRole);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });
  
  app.patch("/api/roles/:id", async (req, res) => {
    try {
      const roleId = Number(req.params.id);
      const role = await storage.getRole(roleId);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      // Validate the update data
      const updateData = req.body;
      const updatedRole = await storage.updateRole(roleId, updateData);
      
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });
  
  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const roleId = Number(req.params.id);
      const role = await storage.getRole(roleId);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      const success = await storage.deleteRole(roleId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete role" });
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });
  
  // ShiftRole endpoints
  app.get("/api/shifts/:shiftId/roles", async (req, res) => {
    try {
      const shiftId = Number(req.params.shiftId);
      const shiftRoles = await storage.getShiftRoles(shiftId);
      res.json(shiftRoles);
    } catch (error) {
      console.error("Error fetching shift roles:", error);
      res.status(500).json({ message: "Failed to fetch shift roles" });
    }
  });
  
  app.post("/api/shift-roles", async (req, res) => {
    try {
      const parsedBody = insertShiftRoleSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid shift-role assignment data", 
          errors: parsedBody.error.errors 
        });
      }
      
      const shiftRoleData = parsedBody.data;
      const newShiftRole = await storage.assignRoleToShift(shiftRoleData);
      
      res.status(201).json(newShiftRole);
    } catch (error) {
      console.error("Error assigning role to shift:", error);
      res.status(500).json({ message: "Failed to assign role to shift" });
    }
  });
  
  app.delete("/api/shifts/:shiftId/roles/:roleId", async (req, res) => {
    try {
      const shiftId = Number(req.params.shiftId);
      const roleId = Number(req.params.roleId);
      
      const success = await storage.removeRoleFromShift(shiftId, roleId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Shift-role association not found" });
      }
    } catch (error) {
      console.error("Error removing role from shift:", error);
      res.status(500).json({ message: "Failed to remove role from shift" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
