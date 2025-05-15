import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import Home from "@/pages/Home";
import VolunteerList from "@/pages/VolunteerList";
import VolunteerDetail from "@/pages/VolunteerDetail";
import Confirmation from "@/pages/Confirmation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
            <AuthProvider>
              <Router />
            </AuthProvider>
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
