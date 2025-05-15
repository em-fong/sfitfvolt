import { useQuery } from "@tanstack/react-query";
import { useToast } from "./use-toast";

interface AuthUser {
  id: number;
  username: string;
  claims: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

export function useAuth() {
  const { toast } = useToast();
  
  const { 
    data: user, 
    isLoading,
    error,
    refetch
  } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refresh auth status every 5 minutes
  });

  const isAuthenticated = !!user;
  
  const login = () => {
    window.location.href = "/api/login";
  };
  
  const logout = () => {
    window.location.href = "/api/logout";
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetch
  };
}