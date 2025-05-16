import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface EventResponse {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
}

interface Shift {
  id: number;
  eventId: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  maxVolunteers: number;
}

interface Role {
  id: number;
  eventId: number;
  name: string;
  description?: string;
}

interface ShiftWithRoles extends Shift {
  roles: Role[];
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, "EEEE, MMMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
}

export default function EventConfirmation() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute('/events/:eventId/confirmation');
  const eventId = match ? Number(params?.eventId) : 0;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch event details
  const { data: event, isLoading: isEventLoading } = useQuery<EventResponse>({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      if (!eventId) return null as unknown as EventResponse;
      const res = await apiRequest<EventResponse>('GET', `/api/events/${eventId}`);
      return res;
    },
    enabled: !!eventId,
  });

  // Fetch shifts for this event
  const { data: shifts, isLoading: isShiftsLoading } = useQuery<Shift[]>({
    queryKey: ['/api/events', eventId, 'shifts'],
    queryFn: async () => {
      if (!eventId) return [];
      const res = await apiRequest<Shift[]>('GET', `/api/events/${eventId}/shifts`);
      return res;
    },
    enabled: !!eventId,
  });
  
  // Fetch roles for this event
  const { data: roles = [], isLoading: isRolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/events', eventId, 'roles'],
    queryFn: async () => {
      if (!eventId) return [];
      const res = await apiRequest<Role[]>('GET', `/api/events/${eventId}/roles`);
      return res;
    },
    enabled: !!eventId,
  });
  
  // Fetch shift-role assignments for each shift
  const [shiftsWithRoles, setShiftsWithRoles] = useState<ShiftWithRoles[]>([]);
  
  useEffect(() => {
    const fetchShiftRoles = async () => {
      if (!shifts || shifts.length === 0) return;
      
      const shiftsWithRolesData: ShiftWithRoles[] = [];
      
      for (const shift of shifts) {
        try {
          const shiftRoles = await apiRequest<Array<{role: Role}>>('GET', `/api/shifts/${shift.id}/roles`);
          
          shiftsWithRolesData.push({
            ...shift,
            roles: shiftRoles.map(sr => sr.role)
          });
        } catch (error) {
          console.error(`Error fetching roles for shift ${shift.id}:`, error);
          shiftsWithRolesData.push({
            ...shift,
            roles: []
          });
        }
      }
      
      setShiftsWithRoles(shiftsWithRolesData);
    };
    
    fetchShiftRoles();
  }, [shifts]);

  // Group shifts by date
  const shiftsByDate = shifts?.reduce((acc: Record<string, Shift[]>, shift) => {
    const dateStr = shift.shiftDate;
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(shift);
    return acc;
  }, {}) || {};

  const handlePublish = async () => {
    if (!event) return;
    
    setIsPublishing(true);
    try {
      // In a real app, we might have a specific endpoint to publish the event
      // For now, we'll just invalidate the queries to refresh the home page
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      toast({
        title: "Success",
        description: "Event published successfully!",
        variant: "default",
      });
      
      // Navigate back to the home page
      navigate('/');
    } catch (error) {
      console.error('Error publishing event:', error);
      toast({
        title: "Error",
        description: "Failed to publish event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isEventLoading || isShiftsLoading || isRolesLoading) {
    return (
      <div className="px-4 py-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Back
          </button>
        </div>
        <div className="text-center py-10">
          <h1 className="text-xl font-semibold mb-2">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="mb-6">
        <button 
          onClick={() => navigate(`/events/${eventId}/create-roles`)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Back to Roles
        </button>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <Badge variant="secondary" className="px-3 py-1">
          <Check size={16} className="mr-1" /> Review & Publish
        </Badge>
      </div>
      
      <h1 className="text-2xl font-bold mb-8">Event Confirmation</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>Event Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start">
            <CalendarDays className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">Date</div>
              <div className="text-gray-600">{event.date}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">Time</div>
              <div className="text-gray-600">{event.time}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">Location</div>
              <div className="text-gray-600">{event.location}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Volunteer Shifts</h2>
        
        {Object.keys(shiftsByDate).length === 0 && (
          <div className="bg-gray-50 rounded-md p-4 text-center">
            <p className="text-gray-600">No shifts have been created yet.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`/events/${eventId}/create-shifts`)}
            >
              Add Shifts
            </Button>
          </div>
        )}
        
        {Object.entries(shiftsByDate).map(([dateStr, dateShifts], dateIndex) => (
          <div key={dateStr} className="mb-6">
            <h3 className="font-medium text-lg mb-2">{formatDate(dateStr)}</h3>
            
            <div className="space-y-3">
              {dateShifts.map((shift, shiftIndex) => (
                <Card key={shift.id} className="bg-gray-50">
                  <CardHeader className="py-3 px-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{shift.title}</CardTitle>
                      <div className="text-sm font-medium">{shift.startTime} - {shift.endTime}</div>
                    </div>
                  </CardHeader>
                  
                  {shift.description && (
                    <CardContent className="py-2 px-4">
                      <p className="text-sm text-gray-600">{shift.description}</p>
                    </CardContent>
                  )}
                  
                  {/* Show roles assigned to this shift */}
                  {(() => {
                    const shiftWithRole = shiftsWithRoles.find(s => s.id === shift.id);
                    return shiftWithRole && shiftWithRole.roles.length > 0 && (
                      <CardContent className="py-0 px-4">
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Roles:</p>
                          <div className="flex flex-wrap gap-1">
                            {shiftWithRole.roles.map(role => (
                              <Badge key={role.id} variant="outline" className="text-xs">
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    );
                  })()}
                  
                  <CardFooter className="py-2 px-4 flex justify-between text-sm">
                    <div className="flex items-center">
                      <Users size={14} className="mr-1" />
                      <span>{shift.maxVolunteers > 0 ? `${shift.maxVolunteers} volunteers max` : 'Unlimited volunteers'}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <Separator className="my-6" />
      
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/events/${eventId}/create-roles`)}
          disabled={isPublishing}
        >
          Edit Roles
        </Button>
        
        <Button 
          onClick={handlePublish}
          disabled={isPublishing}
          className="min-w-28"
        >
          {isPublishing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Publishing...
            </>
          ) : (
            'Publish Event'
          )}
        </Button>
      </div>
    </div>
  );
}