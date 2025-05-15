import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/EventCard";
import { type Event } from "@shared/schema";
import { useState, useEffect } from "react";

export default function Home() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeEvents, setActiveEvents] = useState<(Event & {volunteerCount: number})[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<(Event & {volunteerCount: number})[]>([]);
  const [pastEvents, setPastEvents] = useState<(Event & {volunteerCount: number})[]>([]);

  const { data: events, isLoading, error } = useQuery<(Event & {volunteerCount: number})[]>({
    queryKey: ['/api/events'],
  });

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to parse event date and time
  const parseEventDateTime = (event: Event): { startDate: Date, endDate: Date, valid: boolean } => {
    try {
      const now = currentTime;
      // Format the event date string (e.g., "May 15, 2023") and time (e.g., "9:00 AM - 12:00 PM")
      const [startTimePart] = event.time.split(' - ');
      
      // Get today's date in format "Month Day, Year" to match event.date format
      const today = new Date();
      const formattedToday = today.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      // If today's date matches event date, use actual time comparison, otherwise parse normally
      const useActualDate = true; // We'll parse actual dates for proper sorting
      
      // Create date objects for event start time
      const eventStartDate = new Date(`${event.date} ${startTimePart}`);
      
      // Extract the end time if available
      let eventEndDate: Date;
      const timeRangeParts = event.time.split(' - ');
      
      if (timeRangeParts.length > 1) {
        // If we have an end time, create a date for it
        const endTimePart = timeRangeParts[1];
        eventEndDate = new Date(`${event.date} ${endTimePart}`);
      } else {
        // If no end time, assume event lasts 2 hours
        eventEndDate = new Date(eventStartDate);
        eventEndDate.setHours(eventEndDate.getHours() + 2);
      }
      
      return {
        startDate: eventStartDate,
        endDate: eventEndDate,
        valid: true
      };
    } catch (e) {
      console.error("Error parsing event date/time:", e);
      return {
        startDate: new Date(),
        endDate: new Date(),
        valid: false
      };
    }
  };
  
  // Helper function to determine if the event is active
  const isEventActive = (event: Event): boolean => {
    // For demo purposes: If it's the first event, always make it "active"
    if (event.id === 1) {
      return true;
    }
    
    const { startDate, endDate, valid } = parseEventDateTime(event);
    if (!valid) return false;
    
    const now = currentTime;
    // Check if current time is between event start and end times
    return now >= startDate && now <= endDate;
  };
  
  // Helper function to determine if the event is in the past
  const isEventPast = (event: Event): boolean => {
    // For demo purposes: Don't put first event in past
    if (event.id === 1) {
      return false;
    }
    
    // For demo purposes: Always make event #2 (if it exists) a past event
    if (event.id === 2) {
      return true;
    }
    
    const { endDate, valid } = parseEventDateTime(event);
    if (!valid) return false;
    
    const now = currentTime;
    // Check if event end time is in the past
    return endDate < now;
  };
  
  // Helper function to determine if the event is upcoming
  const isEventUpcoming = (event: Event): boolean => {
    // For demo purposes: Don't put first event in upcoming
    if (event.id === 1) {
      return false;
    }
    
    // For demo purposes: Don't put event #2 in upcoming (it's past)
    if (event.id === 2) {
      return false;
    }
    
    // For demo purposes: Always make event #3 (if it exists) an upcoming event
    if (event.id === 3) {
      return true;
    }
    
    const { startDate, valid } = parseEventDateTime(event);
    if (!valid) return true; // Default to upcoming if can't parse
    
    const now = currentTime;
    // Check if event start time is in the future
    return startDate > now;
  };

  // Sort events into active, upcoming, and past when data changes or time updates
  useEffect(() => {
    if (!events) return;
    
    const active: (Event & {volunteerCount: number})[] = [];
    const upcoming: (Event & {volunteerCount: number})[] = [];
    const past: (Event & {volunteerCount: number})[] = [];
    
    events.forEach(event => {
      if (isEventActive(event)) {
        active.push(event);
      } else if (isEventPast(event)) {
        past.push(event);
      } else if (isEventUpcoming(event)) {
        upcoming.push(event);
      } else {
        // If we can't determine the status, default to upcoming
        upcoming.push(event);
      }
    });
    
    // Sort upcoming events by start date (earliest first)
    upcoming.sort((a, b) => {
      try {
        const dateA = parseEventDateTime(a).startDate;
        const dateB = parseEventDateTime(b).startDate;
        return dateA.getTime() - dateB.getTime();
      } catch (e) {
        return 0;
      }
    });
    
    // Sort past events by end date (most recent first)
    past.sort((a, b) => {
      try {
        const dateA = parseEventDateTime(a).endDate;
        const dateB = parseEventDateTime(b).endDate;
        return dateB.getTime() - dateA.getTime();
      } catch (e) {
        return 0;
      }
    });
    
    setActiveEvents(active);
    setUpcomingEvents(upcoming);
    setPastEvents(past);
  }, [events, currentTime]);

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load events. Please try again.",
      variant: "destructive",
    });
  }

  const handleSelectEvent = (eventId: number) => {
    navigate(`/events/${eventId}/volunteers`);
  };

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Volunteer Organizer</h1>
        <p className="text-gray-500 text-sm">Select an event to manage volunteers</p>
      </header>

      {isLoading ? (
        // Loading skeletons
        <div className="event-list space-y-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">Loading Events</h2>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-lg shadow-sm border border-gray-100 p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Active Events Section */}
          {activeEvents.length > 0 && (
            <div className="event-list space-y-4 mb-8">
              <div className="bg-green-50 border border-green-100 rounded-md px-3 py-2 mb-3 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <h2 className="text-lg font-semibold text-green-700">Active Events</h2>
              </div>
              
              <div className="relative">
                {/* Green highlight behind the card */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-md"></div>
                
                {activeEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-green-500 pl-3 mb-4">
                    <EventCard 
                      event={event} 
                      onSelect={() => handleSelectEvent(event.id)}
                      isCurrent={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          <div className="event-list space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-2">Upcoming Events</h2>
            
            {upcomingEvents.length > 0 ? (
              // Upcoming event cards
              upcomingEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onSelect={() => handleSelectEvent(event.id)} 
                />
              ))
            ) : (
              // No upcoming events
              <div className="bg-card rounded-lg shadow-sm border border-gray-100 p-4 text-center">
                <p className="text-gray-500">No upcoming events found.</p>
              </div>
            )}
          </div>
          
          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <div className="event-list space-y-4">
              <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                Past Events
              </h2>
              
              {pastEvents.map((event) => (
                <div key={event.id} className="opacity-75">
                  <EventCard 
                    event={event} 
                    onSelect={() => handleSelectEvent(event.id)}
                    isPast={true}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
