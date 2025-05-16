import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Time conversion function for comparing times
const timeToMinutes = (timeStr: string): number => {
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr.split(' ')[0], 10);
  const isPM = timeStr.includes('PM') && hour !== 12;
  const isAM = timeStr.includes('AM') && hour === 12;
  
  if (isPM) {
    hour += 12;
  } else if (isAM) {
    hour = 0;
  }
  
  return hour * 60 + minute;
};

// Form validation schema for shifts
const shiftSchema = z.object({
  title: z.string().min(1, "Shift title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
  maxVolunteers: z.number().int().min(0, "Must be at least 0"),
}).refine(
  (data) => {
    if (!data.startTime || !data.endTime) {
      return true; // Let the individual field validations handle empty fields
    }
    
    const startMinutes = timeToMinutes(data.startTime);
    const endMinutes = timeToMinutes(data.endTime);
    
    return endMinutes > startMinutes;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

const shiftsFormSchema = z.object({
  shifts: z.array(shiftSchema).min(1, "At least one shift is required"),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;
type ShiftsFormValues = z.infer<typeof shiftsFormSchema>;

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
      <label className="block text-sm font-medium">{label}</label>
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
            {value || "Select time"}
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

export default function CreateShiftsForDate() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute('/events/:eventId/create-shifts/:dateIndex');
  
  const eventId = match ? Number(params?.eventId) : 0;
  const dateIndex = match ? Number(params?.dateIndex) : 0;
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [allDates, setAllDates] = useState<Date[]>([]);
  const [totalDates, setTotalDates] = useState(0);

  interface EventResponse {
    id: number;
    name: string;
    date: string;
    time: string;
    location: string;
    rawDates?: string; // Pipe-separated list of dates in ISO format
  }

  // Fetch event details
  const { data: event, isLoading: isEventLoading } = useQuery<EventResponse | null>({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const res = await apiRequest<EventResponse>('GET', `/api/events/${eventId}`);
      return res;
    },
    enabled: !!eventId,
  });

  // Parse event dates if available
  useEffect(() => {
    if (!event) return;
    
    try {
      // First try to use the rawDates field if available (more precise)
      if (event.rawDates) {
        const rawDatesList = event.rawDates.split('|');
        const parsedDates = rawDatesList.map(dateStr => new Date(dateStr));
        
        if (parsedDates.length > 0) {
          // Sort dates in ascending order
          const sortedDates = parsedDates.sort((a, b) => a.getTime() - b.getTime());
          setAllDates(sortedDates);
          setTotalDates(sortedDates.length);
          
          // Set current date based on dateIndex
          if (dateIndex >= 0 && dateIndex < sortedDates.length) {
            setCurrentDate(sortedDates[dateIndex]);
          }
          return; // Exit early if we successfully parsed raw dates
        }
      }
      
      // Fallback to parsing the display date format if rawDates isn't available
      if (event.date) {
        // Check if it's a date range (contains "to")
        if (event.date.includes('to')) {
          const [startDateStr, endDateStr] = event.date.split('to').map(d => d.trim());
          
          // Create dates array from start to end
          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          
          const datesArray: Date[] = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            datesArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          setAllDates(datesArray);
          setTotalDates(datesArray.length);
          
          // Set current date based on dateIndex
          if (dateIndex >= 0 && dateIndex < datesArray.length) {
            setCurrentDate(datesArray[dateIndex]);
          }
        } 
        // Check if it contains multiple days separated by commas
        else if (event.date.includes(',')) {
          const dateStrings = event.date.split(',').map(d => d.trim());
          const datesArray = dateStrings.map(d => new Date(d));
          setAllDates(datesArray);
          setTotalDates(datesArray.length);
          
          // Set current date based on dateIndex
          if (dateIndex >= 0 && dateIndex < datesArray.length) {
            setCurrentDate(datesArray[dateIndex]);
          }
        } 
        // Single date
        else {
          const date = new Date(event.date);
          setAllDates([date]);
          setTotalDates(1);
          setCurrentDate(date);
        }
      }
    } catch (error) {
      console.error("Error parsing dates:", error);
      toast({
        title: "Error",
        description: "Could not parse event dates",
        variant: "destructive",
      });
    }
  }, [event, toast, dateIndex]);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ShiftsFormValues>({
    resolver: zodResolver(shiftsFormSchema),
    defaultValues: {
      shifts: [
        {
          title: "",
          startTime: "",
          endTime: "",
          description: "",
          maxVolunteers: 0,
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "shifts"
  });

  const onSubmit = async (data: ShiftsFormValues) => {
    if (!currentDate) {
      toast({
        title: "Error",
        description: "No date selected for shifts",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create all shifts for the selected date
      const createdShifts = await Promise.all(
        data.shifts.map(async (shift) => {
          const shiftData = {
            eventId,
            shiftDate: currentDate,
            title: shift.title,
            startTime: shift.startTime,
            endTime: shift.endTime,
            description: shift.description || "",
            maxVolunteers: shift.maxVolunteers,
          };
          
          return await apiRequest('POST', '/api/shifts', shiftData);
        })
      );

      // Invalidate the shifts query to refresh the data
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/shifts`] });

      toast({
        title: "Success",
        description: `${createdShifts.length} shifts created for ${format(currentDate, "PP")}`,
        variant: "default",
      });

      // If there are more dates to process, go to the next date
      if (dateIndex < totalDates - 1) {
        navigate(`/events/${eventId}/create-shifts/${dateIndex + 1}`);
      } else {
        // All dates are processed, go to the roles page
        navigate(`/events/${eventId}/create-roles`);
      }
    } catch (error) {
      console.error('Error creating shifts:', error);
      toast({
        title: "Error",
        description: "Failed to create shifts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEventLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Event Not Found</h1>
          <p className="text-gray-600 mt-2">We couldn't find the event you're looking for.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={() => navigate(`/events/${eventId}/create-event`)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Back to Event Details
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-2">
        Create Shifts for {currentDate ? format(currentDate, "EEEE, MMMM d, yyyy") : "Selected Date"}
      </h1>
      <p className="text-gray-600 mb-6">
        For event: <span className="font-medium">{event.name}</span>
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-blue-700">
          <strong>Progress:</strong> Creating shifts for day {dateIndex + 1} of {totalDates}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Shifts for {currentDate ? format(currentDate, "MMMM d, yyyy") : "Selected Date"}
            </h2>
          </div>

          {fields.map((field, index) => (
            <div 
              key={field.id} 
              className="p-4 border border-gray-200 rounded-md mb-4 bg-white"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Shift {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Shift Title
                  </label>
                  <Controller
                    control={control}
                    name={`shifts.${index}.title`}
                    render={({ field }) => (
                      <input
                        {...field}
                        className={`w-full p-2 border rounded-md ${
                          errors.shifts?.[index]?.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Morning Shift"
                      />
                    )}
                  />
                  {errors.shifts?.[index]?.title && (
                    <p className="text-red-500 text-xs">{errors.shifts?.[index]?.title?.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="w-full">
                    <Controller
                      control={control}
                      name={`shifts.${index}.startTime`}
                      render={({ field }) => (
                        <TimePicker
                          label="Start Time"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.shifts?.[index]?.startTime?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="w-full">
                    <Controller
                      control={control}
                      name={`shifts.${index}.endTime`}
                      render={({ field }) => (
                        <TimePicker
                          label="End Time"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.shifts?.[index]?.endTime?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Controller
                    control={control}
                    name={`shifts.${index}.description`}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                        placeholder="Brief description of this shift's responsibilities"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 max-w-xs">
                  <label className="block text-sm font-medium">
                    Maximum Volunteers
                  </label>
                  <Controller
                    control={control}
                    name={`shifts.${index}.maxVolunteers`}
                    render={({ field: { onChange, ...field } }) => (
                      <input
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          onChange(isNaN(value) ? 0 : value);
                        }}
                        type="number"
                        min="0"
                        className={`w-full p-2 border rounded-md ${
                          errors.shifts?.[index]?.maxVolunteers ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="5"
                      />
                    )}
                  />
                  {errors.shifts?.[index]?.maxVolunteers && (
                    <p className="text-red-500 text-xs">{errors.shifts?.[index]?.maxVolunteers?.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={() => append({
              title: "",
              startTime: "",
              endTime: "",
              description: "",
              maxVolunteers: 0,
            })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Another Shift
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (dateIndex > 0) {
                navigate(`/events/${eventId}/create-shifts/${dateIndex - 1}`);
              } else {
                navigate(`/events/${eventId}/create-event`);
              }
            }}
            disabled={isLoading}
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
            ) : dateIndex < totalDates - 1 ? 'Save & Continue to Next Day' : 'Save & Continue to Roles'
            }
          </Button>
        </div>
      </form>
    </div>
  );
}