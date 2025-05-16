import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2 } from "lucide-react";

// Define form schema
const roleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

const rolesFormSchema = z.object({
  roles: z.array(roleSchema),
});

type RoleFormValues = z.infer<typeof roleSchema>;
type RolesFormValues = z.infer<typeof rolesFormSchema>;

interface Role {
  id: number;
  name: string;
  description?: string;
}

export default function CreateRoles() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute('/events/:eventId/create-roles');
  const eventId = match ? Number(params?.eventId) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Form for managing roles
  const form = useForm<RolesFormValues>({
    resolver: zodResolver(rolesFormSchema),
    defaultValues: {
      roles: [{ name: "", description: "" }],
    },
  });
  
  // Use field array to handle dynamic role fields
  const { fields, append, remove } = useFieldArray({
    name: "roles",
    control: form.control,
  });
  
  // Fetch event details
  const { data: event } = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      return apiRequest('GET', `/api/events/${eventId}`);
    },
    enabled: !!eventId,
  });
  
  const addNewRole = () => {
    append({ name: "", description: "" });
  };
  
  const onSubmit = async (data: RolesFormValues) => {
    if (!eventId) return;
    
    setIsLoading(true);
    
    try {
      // Create all the roles
      const createdRoles: Role[] = [];
      
      for (const role of data.roles) {
        if (!role.name.trim()) continue; // Skip empty roles
        
        const newRole = await apiRequest<Role>('POST', '/api/roles', {
          eventId,
          name: role.name.trim(),
          description: role.description?.trim() || "",
        });
        
        createdRoles.push(newRole);
      }
      
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'roles'] });
      
      toast({
        title: "Success",
        description: `Created ${createdRoles.length} roles for the event`,
        variant: "default",
      });
      
      // Navigate to the assign roles page
      navigate(`/events/${eventId}/assign-roles`);
    } catch (error) {
      console.error('Error creating roles:', error);
      toast({
        title: "Error",
        description: "Failed to create roles. Please try again.",
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
  
  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={() => navigate(`/events/${eventId}/create-shifts`)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Back to Shifts
        </button>
      </div>
      
      <div className="mb-4 flex items-center space-x-2">
        <Badge variant="secondary" className="px-3 py-1">
          Step 3
        </Badge>
        <h1 className="text-2xl font-bold">Define Volunteer Roles</h1>
      </div>
      
      <p className="text-gray-600 mb-6">
        Create roles for volunteers to fill during this event. Roles define the specific activities or teams that volunteers will be assigned to during their shifts.
      </p>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Define Roles</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addNewRole}
              type="button"
              className="h-8 text-primary"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Role
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Role {index + 1}</h3>
                      {fields.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => remove(index)}
                          className="h-6 p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove role</span>
                        </Button>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`roles.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Registration, Setup, Food Service" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`roles.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="mt-3">
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the role's responsibilities and requirements..." 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </ScrollArea>
              
              <div className="pt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/events/${eventId}/create-shifts`)}
                  disabled={isLoading}
                  type="button"
                >
                  Back
                </Button>
                
                <Button 
                  type="submit"
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
                    'Continue to Assign Roles'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}