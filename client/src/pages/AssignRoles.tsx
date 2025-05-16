import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock } from "lucide-react";

interface Shift {
  id: number;
  title: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

export default function AssignRoles() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute('/events/:eventId/assign-roles');
  const eventId = match ? Number(params?.eventId) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [shiftRoleAssignments, setShiftRoleAssignments] = useState<Map<number, Set<number>>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Fetch event details
  const { data: event } = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      return apiRequest('GET', `/api/events/${eventId}`);
    },
    enabled: !!eventId,
  });
  
  // Fetch shifts for this event
  const { data: shifts = [], isLoading: isShiftsLoading } = useQuery<Shift[]>({
    queryKey: ['/api/events', eventId, 'shifts'],
    queryFn: async () => {
      if (!eventId) return [];
      return apiRequest('GET', `/api/events/${eventId}/shifts`);
    },
    enabled: !!eventId,
  });

  // Fetch roles for this event
  const { data: roles = [], isLoading: isRolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/events', eventId, 'roles'],
    queryFn: async () => {
      if (!eventId) return [];
      return apiRequest('GET', `/api/events/${eventId}/roles`);
    },
    enabled: !!eventId,
  });
  
  // Fetch existing role assignments for each shift
  useEffect(() => {
    const fetchExistingAssignments = async () => {
      if (!shifts.length || !roles.length) return;
      
      const newAssignments = new Map<number, Set<number>>();
      
      for (const shift of shifts) {
        try {
          const shiftRoles = await apiRequest<Array<{role: Role}>>('GET', `/api/shifts/${shift.id}/roles`);
          const roleIds = new Set(shiftRoles.map(sr => sr.role.id));
          newAssignments.set(shift.id, roleIds);
        } catch (error) {
          console.error(`Error fetching roles for shift ${shift.id}:`, error);
          newAssignments.set(shift.id, new Set());
        }
      }
      
      setShiftRoleAssignments(newAssignments);
    };
    
    fetchExistingAssignments();
  }, [shifts, roles]);
  
  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc: Record<string, Shift[]>, shift) => {
    const dateStr = shift.shiftDate;
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(shift);
    return acc;
  }, {});

  // Get unique dates from shifts
  const availableDates = Object.keys(shiftsByDate).sort();

  // Select the first date by default when shifts are loaded
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  // Select the first shift of the selected date by default
  useEffect(() => {
    if (selectedDate && shiftsByDate[selectedDate]?.length > 0 && !selectedShiftId) {
      setSelectedShiftId(shiftsByDate[selectedDate][0].id);
    }
  }, [selectedDate, shiftsByDate]);
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  // Toggle role assignment for a shift
  const toggleRoleAssignment = (shiftId: number, roleId: number) => {
    setShiftRoleAssignments(prevState => {
      const newState = new Map(prevState);
      
      if (!newState.has(shiftId)) {
        newState.set(shiftId, new Set([roleId]));
      } else {
        const roleIds = newState.get(shiftId)!;
        
        if (roleIds.has(roleId)) {
          roleIds.delete(roleId);
        } else {
          roleIds.add(roleId);
        }
      }
      
      return newState;
    });
  };
  
  const isRoleAssignedToShift = (shiftId: number, roleId: number): boolean => {
    return shiftRoleAssignments.get(shiftId)?.has(roleId) || false;
  };
  
  const handleSaveAssignments = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    
    try {
      // First, remove all existing assignments
      for (const shift of shifts) {
        try {
          const existingRoles = await apiRequest<Array<{role: Role}>>('GET', `/api/shifts/${shift.id}/roles`);
          
          for (const { role } of existingRoles) {
            await apiRequest('DELETE', `/api/shifts/${shift.id}/roles/${role.id}`);
          }
        } catch (error) {
          console.error(`Error clearing roles for shift ${shift.id}:`, error);
        }
      }
      
      // Then, create all the new assignments
      const assignments: { shiftId: number; roleId: number }[] = [];
      
      // Convert Map entries to array for compatibility
      Array.from(shiftRoleAssignments.entries()).forEach(([shiftId, roleIds]) => {
        Array.from(roleIds).forEach(roleId => {
          assignments.push({
            shiftId,
            roleId
          });
        });
      });
      
      // Make all assignment requests
      for (const assignment of assignments) {
        await apiRequest('POST', '/api/shift-roles', assignment);
      }
      
      toast({
        title: "Success",
        description: "Role assignments saved successfully",
        variant: "default",
      });
      
      // Navigate to the confirmation page
      navigate(`/events/${eventId}/confirmation`);
    } catch (error) {
      console.error('Error saving role assignments:', error);
      toast({
        title: "Error",
        description: "Failed to save role assignments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!eventId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Event Not Found</h1>
          <p className="text-gray-600 mt-2">Unable to load event details.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  if (isShiftsLoading || isRolesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!roles.length) {
    return (
      <div className="px-4 py-6 max-w-4xl mx-auto">
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
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Roles Created</h2>
          <p className="text-gray-600 mb-6">You need to create roles before assigning them to shifts.</p>
          <Button onClick={() => navigate(`/events/${eventId}/create-roles`)}>
            Create Roles
          </Button>
        </div>
      </div>
    );
  }
  
  if (!shifts.length) {
    return (
      <div className="px-4 py-6 max-w-4xl mx-auto">
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
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Shifts Created</h2>
          <p className="text-gray-600 mb-6">You need to create shifts before assigning roles to them.</p>
          <Button onClick={() => navigate(`/events/${eventId}/create-shifts`)}>
            Create Shifts
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
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
          Step 4
        </Badge>
        <h1 className="text-2xl font-bold">Assign Roles to Shifts</h1>
      </div>
      
      <p className="text-gray-600 mb-6">
        Select which roles are needed for each shift. These role assignments will help volunteers understand their responsibilities.
      </p>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Assign Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Date selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <div className="flex flex-wrap gap-2">
              {availableDates.map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? "default" : "outline"}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedShiftId(null);
                  }}
                  className="mb-2"
                >
                  {formatDate(date)}
                </Button>
              ))}
            </div>
          </div>
          
          {/* No shifts message */}
          {selectedDate && shiftsByDate[selectedDate]?.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-600">No shifts available for this date.</p>
            </div>
          )}
          
          {/* Shifts for selected date */}
          {selectedDate && shiftsByDate[selectedDate]?.length > 0 && (
            <Tabs 
              defaultValue={shiftsByDate[selectedDate][0]?.id.toString()} 
              value={selectedShiftId?.toString()}
              onValueChange={(value) => setSelectedShiftId(Number(value))}
            >
              <ScrollArea className="h-12 w-full">
                <TabsList className="w-full justify-start">
                  {shiftsByDate[selectedDate].map((shift) => (
                    <TabsTrigger key={shift.id} value={shift.id.toString()} className="whitespace-nowrap">
                      {shift.title} <span className="ml-1 text-xs text-gray-500">({shift.startTime}-{shift.endTime})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
              
              {shiftsByDate[selectedDate].map((shift) => (
                <TabsContent key={shift.id} value={shift.id.toString()}>
                  <div className="mb-4">
                    <div className="flex items-start mb-1">
                      <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span>{formatDate(shift.shiftDate)}</span>
                    </div>
                    <div className="flex items-start mb-1">
                      <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                    {shift.description && (
                      <p className="text-sm text-gray-600 mt-2">{shift.description}</p>
                    )}
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="mt-6">
                    <h3 className="text-base font-medium mb-4">Available Roles</h3>
                    
                    <div className="space-y-3">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-start space-x-2">
                          <Checkbox 
                            id={`role-${role.id}-shift-${shift.id}`}
                            checked={isRoleAssignedToShift(shift.id, role.id)}
                            onCheckedChange={() => toggleRoleAssignment(shift.id, role.id)}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <label 
                              htmlFor={`role-${role.id}-shift-${shift.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {role.name}
                            </label>
                            {role.description && (
                              <p className="text-xs text-gray-500">{role.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {roles.length === 0 && (
                        <p className="text-sm text-gray-500">No roles available. Please create roles first.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/events/${eventId}/create-roles`)}
          disabled={isLoading}
        >
          Back
        </Button>
        
        <Button 
          onClick={handleSaveAssignments}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Continue to Review'
          )}
        </Button>
      </div>
    </div>
  );
}