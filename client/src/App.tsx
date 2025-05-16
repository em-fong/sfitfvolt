import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import VolunteerList from "@/pages/VolunteerList";
import VolunteerDetail from "@/pages/VolunteerDetail";
import Confirmation from "@/pages/Confirmation";
import CreateEvent from "@/pages/CreateEvent";
import CreateShifts from "@/pages/CreateShifts";
import CreateRoles from "@/pages/CreateRoles";
import EventConfirmation from "@/pages/EventConfirmation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-event" component={CreateEvent} />
      <Route path="/events/:eventId/create-shifts" component={CreateShifts} />
      <Route path="/events/:eventId/create-roles" component={CreateRoles} />
      <Route path="/events/:eventId/confirmation" component={EventConfirmation} />
      <Route path="/events/:eventId/volunteers" component={VolunteerList} />
      <Route path="/events/:eventId/volunteers/:volunteerId" component={VolunteerDetail} />
      <Route path="/events/:eventId/volunteers/:volunteerId/confirmation" component={Confirmation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="bg-background min-h-screen">
          <div className="max-w-md mx-auto pb-24 relative min-h-screen">
            <Toaster />
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
