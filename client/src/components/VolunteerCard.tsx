import { type Volunteer } from "@shared/schema";
import { User } from "lucide-react";

interface VolunteerCardProps {
  volunteer: Volunteer;
  onClick: () => void;
}

export default function VolunteerCard({ volunteer, onClick }: VolunteerCardProps) {
  return (
    <div 
      className="volunteer-card bg-card rounded-lg shadow-sm border border-gray-100 p-4 flex items-center transition-all hover:shadow-md active:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
        <User className="h-5 w-5 text-gray-500" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-foreground">{volunteer.name}</h3>
        <p className="text-sm text-gray-500">{volunteer.email}</p>
      </div>
      <div className="ml-2">
        {volunteer.checkedIn ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-10 text-success">
            Checked In
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning bg-opacity-10 text-warning">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}
