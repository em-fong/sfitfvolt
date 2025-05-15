import { type Event } from "@shared/schema";
import { Calendar, Clock, MapPin, ArrowRight, User } from "lucide-react";

interface EventCardProps {
  event: Event & { volunteerCount: number };
  onSelect: () => void;
  isCurrent?: boolean;
}

export default function EventCard({ event, onSelect, isCurrent = false }: EventCardProps) {
  return (
    <div 
      className={`event-card bg-card rounded-lg shadow-sm border ${isCurrent ? 'border-green-200' : 'border-gray-100'} p-4 transition-all hover:shadow-md active:bg-gray-50 cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{event.name}</h3>
            {isCurrent && (
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center">
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Active
              </span>
            )}
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{event.date}</span>
            <span className="mx-1">•</span>
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            <span>{event.location}</span>
          </div>
        </div>
        <span className={`${isCurrent ? 'bg-green-50 text-green-700' : 'bg-primary-50 text-primary-600'} text-xs font-medium px-2.5 py-1 rounded-full`}>
          {event.volunteerCount} volunteers
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {/* Show avatar placeholders */}
          {Array.from({ length: Math.min(3, event.volunteerCount) }).map((_, i) => (
            <div 
              key={i} 
              className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-500"
            >
              <User className="h-3.5 w-3.5" />
            </div>
          ))}
          
          {event.volunteerCount > 3 && (
            <div className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs text-primary-600">
              +{event.volunteerCount - 3}
            </div>
          )}
        </div>
        <div className="text-sm font-medium text-primary-600 flex items-center">
          Manage <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
