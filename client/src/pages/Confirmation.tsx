import { useParams, useLocation } from "wouter";
import { useCheckInStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, User, Users, Home } from "lucide-react";
import { type Volunteer } from "@shared/schema";

export default function Confirmation() {
  const { eventId, volunteerId } = useParams<{ eventId: string, volunteerId: string }>();
  const [_, navigate] = useLocation();
  const { selectedVolunteer } = useCheckInStore();

  // Fetch volunteer details if not in store (e.g., page refresh)
  const { data: volunteer, isLoading } = useQuery<Volunteer>({
    queryKey: [`/api/volunteers/${volunteerId}`],
    enabled: !selectedVolunteer,
  });

  const currentVolunteer = selectedVolunteer || volunteer;
  
  const handleGoToVolunteerList = () => {
    navigate(`/events/${eventId}/volunteers`);
  };
  
  const handleGoToHome = () => {
    navigate("/");
  };

  // Format the check-in date and time
  const checkInDate = currentVolunteer?.checkInTime
    ? new Date(currentVolunteer.checkInTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  const checkInTime = currentVolunteer?.checkInTime
    ? new Date(currentVolunteer.checkInTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

  return (
    <div className="px-4 py-6">
      {/* Confirmation Header */}
      <div className="text-center pt-10 mb-8">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-success bg-opacity-10 text-success mx-auto mb-6">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Check-in Complete!</h1>
        <p className="text-gray-500">
          {isLoading ? (
            <Skeleton className="h-5 w-48 mx-auto" />
          ) : (
            <>
              <span>{currentVolunteer?.name}</span> has been successfully checked in.
            </>
          )}
        </p>
      </div>

      {/* Volunteer Summary */}
      {isLoading ? (
        <div className="bg-card rounded-lg shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded-full mr-3" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="w-20 h-6 rounded-full" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
        </div>
      ) : currentVolunteer && (
        <div className="volunteer-summary bg-card rounded-lg shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <User className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{currentVolunteer.name}</h2>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <span>{currentVolunteer.role || "No role"}</span>
                {currentVolunteer.team && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{currentVolunteer.team}</span>
                  </>
                )}
              </div>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-10 text-success">
                Checked In
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Check-in Time</p>
                <p className="font-medium text-foreground">
                  {checkInDate} • {checkInTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Checked in by</p>
                <p className="font-medium text-foreground">
                  {currentVolunteer.checkedInBy || "Volunteer Admin"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons space-y-3">
        <Button
          className="w-full py-6 text-base"
          onClick={handleGoToVolunteerList}
        >
          <Users className="mr-2 h-5 w-5" />
          Back to Volunteer List
        </Button>
        <Button
          variant="outline"
          className="w-full py-6 text-base"
          onClick={handleGoToHome}
        >
          <Home className="mr-2 h-5 w-5" />
          Return to Home
        </Button>
      </div>
    </div>
  );
}
