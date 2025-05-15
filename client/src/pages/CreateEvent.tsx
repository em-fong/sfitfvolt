import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { insertEventSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Form validation schema based on the event schema
const createEventSchema = insertEventSchema.extend({
  name: z.string().min(1, "Event name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required"),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

export default function CreateEvent() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      date: "",
      time: "",
      location: ""
    }
  });

  const onSubmit = async (data: CreateEventFormValues) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/events', data);

      // Invalidate the events query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });

      toast({
        title: "Success",
        description: "Event created successfully!",
        variant: "default",
      });

      // Navigate back to the home page
      navigate('/');
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
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

      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Event Name
          </label>
          <input
            id="name"
            {...register("name")}
            className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Community Park Cleanup"
          />
          {errors.name && (
            <p className="text-red-500 text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            {...register("date")}
            className={`w-full p-2 border rounded-md ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="May 15, 2025"
          />
          <p className="text-xs text-gray-500">Format: Month Day, Year (e.g., May 15, 2025)</p>
          {errors.date && (
            <p className="text-red-500 text-xs">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="time" className="block text-sm font-medium">
            Time
          </label>
          <input
            id="time"
            {...register("time")}
            className={`w-full p-2 border rounded-md ${errors.time ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="9:00 AM - 12:00 PM"
          />
          <p className="text-xs text-gray-500">Format: Start Time - End Time (e.g., 9:00 AM - 12:00 PM)</p>
          {errors.time && (
            <p className="text-red-500 text-xs">{errors.time.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            {...register("location")}
            className={`w-full p-2 border rounded-md ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="City Park, 123 Main St"
          />
          {errors.location && (
            <p className="text-red-500 text-xs">{errors.location.message}</p>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center p-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}