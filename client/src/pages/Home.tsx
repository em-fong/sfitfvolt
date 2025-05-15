import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/EventCard";
import { type Event } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const { data: events, isLoading, error } = useQuery<(Event & {volunteerCount: number})[]>({
    queryKey: ['/api/events'],
  });

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

      <div className="event-list space-y-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Upcoming Events</h2>
        
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-lg shadow-sm border border-gray-100 p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          ))
        ) : events && events.length > 0 ? (
          // Event cards
          events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onSelect={() => handleSelectEvent(event.id)} 
            />
          ))
        ) : (
          // No events
          <div className="bg-card rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-gray-500">No upcoming events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
