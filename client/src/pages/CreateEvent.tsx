import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { insertEventSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

// Form validation schema with multiple selected dates
const formSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  selectedDates: z.array(z.date()).min(1, "Please select at least one date"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
});

// Form values type
type FormValues = z.infer<typeof formSchema>;

// Helper function to format dates in ascending order
const formatSelectedDates = (dates: Date[]): string => {
  if (!dates || dates.length === 0) return "";
  
  // Sort dates in ascending order
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  
  if (sortedDates.length === 1) {
    // Single date
    return format(sortedDates[0], "MMMM d, yyyy");
  } else if (sortedDates.length === 2) {
    // Two dates: show them as a range
    return `${format(sortedDates[0], "MMMM d, yyyy")} to ${format(sortedDates[1], "MMMM d, yyyy")}`;
  } else {
    // Multiple non-consecutive dates: list with commas
    const formattedDates = sortedDates.map(date => format(date, "MMMM d, yyyy"));
    return formattedDates.join(", ");
  }
};

// Convert form values to the format expected by the API
const convertFormValuesToApiData = (data: FormValues) => {
  // Sort dates in ascending order for consistent display
  const sortedDates = [...data.selectedDates].sort((a, b) => a.getTime() - b.getTime());
  
  // Format each date separately to maintain consistency
  const formattedDatesList = sortedDates.map(date => format(date, "yyyy-MM-dd"));
  
  // Format the selected dates for display (uses comma-separated format)
  const formattedDates = formatSelectedDates(data.selectedDates);
  
  // Format the time range
  const timeRange = `${data.startTime} - ${data.endTime}`;
  
  return {
    name: data.name,
    date: formattedDates,
    // Store raw dates in ISO format for precise parsing
    rawDates: formattedDatesList.join('|'),
    time: timeRange,
    location: data.location
  };
};

// Time picker component
const TimePicker = ({ 
  label, 
  value, 
  onChange, 
  error 
}: { 
  label: string, 
  value: string, 
  onChange: (value: string) => void, 
  error?: string 
}) => {
  const times = [
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", 
    "8:00 PM", "9:00 PM", "10:00 PM"
  ];

  return (
    <div className="space-y-2">
      <label htmlFor={label} className="block text-sm font-medium">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value || `Select ${label.toLowerCase()}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="max-h-60 overflow-y-auto p-2">
            {times.map((time) => (
              <div
                key={time}
                className={`cursor-pointer rounded-md px-4 py-2 text-sm hover:bg-gray-100 ${
                  value === time ? "bg-gray-100 font-medium" : ""
                }`}
                onClick={() => {
                  onChange(time);
                }}
              >
                {time}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

export default function CreateEvent() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { control, register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      selectedDates: [new Date()],
      startTime: "",
      endTime: "",
      location: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Convert form data to the format expected by the API
      const apiData = convertFormValuesToApiData(data);
      
      const newEvent = await apiRequest('POST', '/api/events', apiData);

      // Invalidate the events query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });

      toast({
        title: "Success",
        description: "Event created successfully! Now create shifts for your volunteers.",
        variant: "default",
      });

      // Navigate to the create shifts page for this event
      navigate(`/events/${newEvent.id}/create-shifts`);
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
          <label className="block text-sm font-medium">
            Event Dates
          </label>
          <Controller
            control={control}
            name="selectedDates"
            render={({ field }) => (
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dates"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        (!field.value || field.value.length === 0) && "text-muted-foreground",
                        errors.selectedDates && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value && field.value.length > 0 ? (
                        <span>
                          {field.value.length === 1
                            ? format(field.value[0], "PPP")
                            : field.value.length === 2
                              ? `${format(field.value[0], "PPP")} to ${format(field.value[1], "PPP")}`
                              : `${field.value.length} dates selected`}
                        </span>
                      ) : (
                        <span>Select event dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      numberOfMonths={2}
                    />
                    <div className="p-3 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        {field.value && field.value.length > 0
                          ? field.value.length === 1
                            ? "1 day selected"
                            : `${field.value.length} days selected`
                          : "Select multiple days"}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          />
          {errors.selectedDates && (
            <p className="text-red-500 text-xs">{errors.selectedDates.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <TimePicker
                label="Start Time"
                value={field.value}
                onChange={field.onChange}
                error={errors.startTime?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <TimePicker
                label="End Time"
                value={field.value}
                onChange={field.onChange}
                error={errors.endTime?.message}
              />
            )}
          />
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