import { useState } from 'react';
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Search, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VolunteerCard from "@/components/VolunteerCard";
import { type Event, type Volunteer } from "@shared/schema";

export default function VolunteerList() {
  const { eventId } = useParams<{ eventId: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
  });

  // Fetch volunteers for this event
  const { data: volunteers, isLoading: volunteersLoading } = useQuery<Volunteer[]>({
    queryKey: [`/api/events/${eventId}/volunteers`],
  });

  // Fetch event stats
  const { data: stats, isLoading: statsLoading } = useQuery<{ total: number, checkedIn: number, pending: number }>({
    queryKey: [`/api/events/${eventId}/stats`],
  });

  const handleBack = () => {
    navigate("/");
  };

  const handleSelectVolunteer = (volunteerId: number) => {
    navigate(`/events/${eventId}/volunteers/${volunteerId}`);
  };

  // Filter volunteers by search query
  const filteredVolunteers = volunteers?.filter(volunteer => 
    volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    volunteer.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    volunteer.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 rounded-full w-8 h-8" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {eventLoading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <h1 className="text-xl font-bold text-foreground">{event?.name}</h1>
          )}
        </div>
        
        {eventLoading ? (
          <Skeleton className="h-5 w-3/4" />
        ) : event && (
          <div className="flex items-center text-sm text-gray-500 flex-wrap gap-y-1">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="mr-2">{event.date}</span>
            <Clock className="h-4 w-4 mr-1" />
            <span className="mr-2">{event.time}</span>
            <MapPin className="h-4 w-4 mr-1" />
            <span>{event.location}</span>
          </div>
        )}
      </header>

      {/* Search Bar */}
      <div className="search-container mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
            placeholder="Search volunteers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-container mb-4 flex space-x-4">
        {statsLoading ? (
          <>
            <Skeleton className="flex-1 h-16 rounded-lg" />
            <Skeleton className="flex-1 h-16 rounded-lg" />
            <Skeleton className="flex-1 h-16 rounded-lg" />
          </>
        ) : stats && (
          <>
            <div className="stat-card flex-1 bg-card rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="stat-card flex-1 bg-card rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Checked In</p>
              <p className="text-lg font-bold text-success">{stats.checkedIn}</p>
            </div>
            <div className="stat-card flex-1 bg-card rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
              <p className="text-lg font-bold text-warning">{stats.pending}</p>
            </div>
          </>
        )}
      </div>

      {/* Volunteer List */}
      <div className="volunteer-list space-y-3">
        <h2 className="text-lg font-semibold text-foreground mb-2">Volunteers</h2>
        
        {volunteersLoading ? (
          // Loading skeletons
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-lg shadow-sm border border-gray-100 p-4 flex items-center">
              <Skeleton className="w-10 h-10 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-5 w-1/2 mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="w-16 h-6 rounded-full" />
            </div>
          ))
        ) : filteredVolunteers && filteredVolunteers.length > 0 ? (
          // Volunteer cards
          filteredVolunteers.map((volunteer) => (
            <VolunteerCard
              key={volunteer.id}
              volunteer={volunteer}
              onClick={() => handleSelectVolunteer(volunteer.id)}
            />
          ))
        ) : (
          // No volunteers found
          <div className="bg-card rounded-lg shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-500">
              {searchQuery ? "No volunteers match your search." : "No volunteers found for this event."}
            </p>
          </div>
        )}
      </div>

      {/* QR Scanner Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        onClick={() => toast({
          title: "QR Scanner",
          description: "Global QR scanning functionality coming soon!",
        })}
      >
        <QrCode className="h-6 w-6" />
      </Button>
    </div>
  );
}

function ArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
