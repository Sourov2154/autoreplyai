import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, Bell } from "lucide-react";
import { User } from "@shared/schema";

interface HeaderProps {
  pageTitle?: string;
}

export default function Header({ pageTitle }: HeaderProps) {
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  
  const initials = typedUser?.firstName && typedUser?.lastName 
    ? `${typedUser.firstName[0]}${typedUser.lastName[0]}` 
    : typedUser?.email?.substring(0, 2)?.toUpperCase() || "AR";

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <header className="bg-white border-b py-4 px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          {pageTitle || "Dashboard"}
        </h1>

        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={typedUser?.profileImageUrl || ''} alt={typedUser?.firstName || 'User'} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium leading-none">{typedUser?.firstName || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-1">{typedUser?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <div className="cursor-pointer w-full">Settings</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}