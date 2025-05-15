import { useState } from 'react';
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useCheckInStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QrScanner from "@/components/QrScanner";
import { User, Phone, ArrowLeft, QrCode, Edit, Check } from "lucide-react";
import { type Volunteer } from "@shared/schema";

export default function VolunteerDetail() {
  const { eventId, volunteerId } = useParams<{ eventId: string, volunteerId: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [checkInMethod, setCheckInMethod] = useState<'qr' | 'manual'>('qr');
  const { setSelectedVolunteer, setCheckInMethod: storeSetCheckInMethod, setCheckInTimestamp } = useCheckInStore();

  // Fetch volunteer details
  const { data: volunteer, isLoading } = useQuery<Volunteer>({
    queryKey: [`/api/volunteers/${volunteerId}`],
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/volunteers/${volunteerId}/check-in`, {
        checkedInBy: "Volunteer Admin" // In a real app, this would be the current user's name
      });
    },
    onSuccess: async (response) => {
      const checkedInVolunteer = await response.json() as Volunteer;
      setSelectedVolunteer(checkedInVolunteer);
      storeSetCheckInMethod(checkInMethod);
      setCheckInTimestamp(new Date());
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/volunteers/${volunteerId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/volunteers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
      
      // Navigate to confirmation page
      navigate(`/events/${eventId}/volunteers/${volunteerId}/confirmation`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check in volunteer. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleBack = () => {
    navigate(`/events/${eventId}/volunteers`);
  };

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  // Handle QR code scanning result
  const handleQrScan = (data: string | null) => {
    if (data) {
      // In a real app, verify the QR code data matches the volunteer
      // For demo purposes, we'll just proceed with check-in
      checkInMutation.mutate();
    }
  };

  // Determine if volunteer is already checked in
  const isCheckedIn = volunteer?.checkedIn;

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 rounded-full w-8 h-8"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Volunteer Details</h1>
        </div>
      </header>

      {/* Volunteer Profile */}
      {isLoading ? (
        <div className="bg-card rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center">
            <Skeleton className="w-16 h-16 rounded-full mr-4" />
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-md p-3">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : volunteer && (
        <div className="volunteer-profile bg-card rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{volunteer.name}</h2>
              <p className="text-gray-500">{volunteer.email}</p>
              <div className="flex items-center mt-1 text-sm">
                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                <span className="text-gray-600">{volunteer.phone || "No phone number"}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                <p className="font-medium text-foreground">{volunteer.role || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Team</p>
                <p className="font-medium text-foreground">{volunteer.team || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">T-Shirt Size</p>
                <p className="font-medium text-foreground">{volunteer.shirtSize || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dietary Needs</p>
                <p className="font-medium text-foreground">{volunteer.dietaryNeeds || "None"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Options - Only show if not already checked in */}
      {!isLoading && volunteer && !isCheckedIn && (
        <div className="check-in-options mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-3">Check-in Method</h3>
          
          <Tabs defaultValue="qr" onValueChange={(value) => setCheckInMethod(value as 'qr' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="qr" className="flex items-center">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qr">
              <div className="bg-gray-900 p-6 rounded-lg mb-4">
                <QrScanner onScan={handleQrScan} />
                <p className="text-center text-white mt-4 text-sm">
                  Position the QR code within the frame to scan
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="manual">
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                <p className="text-gray-700 mb-4">Manually check in this volunteer:</p>
                <div className="flex items-center font-medium">
                  <span className="text-gray-900">{volunteer.name}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-500">{volunteer.role || "No role"}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            className="w-full py-6 text-base"
            onClick={handleCheckIn}
            disabled={checkInMutation.isPending}
          >
            {checkInMutation.isPending ? (
              "Processing..."
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Check In Volunteer
              </>
            )}
          </Button>
        </div>
      )}

      {/* Already Checked In Message */}
      {!isLoading && volunteer && isCheckedIn && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">Already Checked In</h3>
          <p className="text-green-700">
            This volunteer was checked in on{' '}
            {volunteer.checkInTime && new Date(volunteer.checkInTime).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}{' '}
            at{' '}
            {volunteer.checkInTime && new Date(volunteer.checkInTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
          
          <Button 
            variant="outline"
            className="mt-4"
            onClick={handleBack}
          >
            Back to Volunteer List
          </Button>
        </div>
      )}
    </div>
  );
}
