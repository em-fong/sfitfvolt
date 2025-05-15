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
  const [currentEvents, setCurrentEvents] = useState<(Event & {volunteerCount: number})[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<(Event & {volunteerCount: number})[]>([]);

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

  // Helper function to determine if the event is happening now
  const isEventHappeningNow = (event: Event): boolean => {
    try {
      const now = currentTime;
      // Format the event date string (e.g., "May 15, 2023") and time (e.g., "9:00 AM - 12:00 PM")
      const [timePart] = event.time.split(' - ');
      
      // Get today's date in format "Month Day, Year" to match event.date format
      const today = new Date();
      const formattedToday = today.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      // For testing: If today's actual date matches event date, use actual time comparison
      const useActualDate = event.date === formattedToday;
      
      // Create date objects for event start and end times
      // If it's today's date, use actual time. Otherwise, simulate by adjusting minutes
      const eventDate = useActualDate ? 
        new Date(`${event.date} ${timePart}`) : 
        new Date(now.getTime() - 30 * 60000); // 30 minutes ago
      
      // Extract the end time if available
      let eventEndTime: Date;
      const timeRangeParts = event.time.split(' - ');
      
      if (timeRangeParts.length > 1 && useActualDate) {
        // If we have an end time, create a date for it
        const endTimePart = timeRangeParts[1];
        eventEndTime = new Date(`${event.date} ${endTimePart}`);
      } else {
        // If no end time or we're simulating, assume event ends in the future
        eventEndTime = useActualDate ?
          new Date(eventDate.getTime() + 2 * 60 * 60000) : // 2 hours after start
          new Date(now.getTime() + 60 * 60000); // 1 hour from now
      }
      
      // For demo purposes: If it's the first event, always make it "current"
      if (event.id === 1) {
        return true;
      }
      
      // Check if current time is between event start and end times
      return now >= eventDate && now <= eventEndTime;
    } catch (e) {
      console.error("Error parsing event date/time:", e);
      return false;
    }
  };

  // Sort events into current and upcoming when data changes or time updates
  useEffect(() => {
    if (!events) return;
    
    const current: (Event & {volunteerCount: number})[] = [];
    const upcoming: (Event & {volunteerCount: number})[] = [];
    
    events.forEach(event => {
      if (isEventHappeningNow(event)) {
        current.push(event);
      } else {
        upcoming.push(event);
      }
    });
    
    setCurrentEvents(current);
    setUpcomingEvents(upcoming);
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
          {/* Current Events Section */}
          {currentEvents.length > 0 && (
            <div className="event-list space-y-4 mb-8">
              <div className="bg-green-50 border border-green-100 rounded-md px-3 py-2 mb-3 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <h2 className="text-lg font-semibold text-green-700">Current Events</h2>
              </div>
              
              <div className="relative">
                {/* Green highlight behind the card */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-md"></div>
                
                {currentEvents.map((event) => (
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
          <div className="event-list space-y-4">
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
        </>
      )}
    </div>
  );
}
