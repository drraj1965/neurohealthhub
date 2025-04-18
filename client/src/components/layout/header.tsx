import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut,
  User,
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not log out properly",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary-600 cursor-pointer">NeuroHealthHub</h1>
            </Link>
            
            {isAdmin && (
              <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                Admin
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {user?.firstName?.[0] || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/" className="flex w-full items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="#" className="flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Your Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="#" className="flex w-full items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem>
                      <Link href="/super-admin" className="flex w-full items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Super Admin</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/firebase-test" className="flex w-full items-center">
                        <svg className="mr-2 h-4 w-4" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.38899 19.1488L4.61315 8.40429C4.65562 8.0922 4.98079 7.8972 5.28514 7.98383L10.7086 9.63041C10.8959 9.68653 10.9978 9.88057 10.9478 10.0707L9.30716 15.8871C9.2627 16.0565 9.11409 16.1713 8.93845 16.1713H3.89026C3.61691 16.1713 3.40825 15.8716 3.47987 15.6064L3.76195 14.4521L8.08818 14.4522C8.26358 14.4522 8.4121 14.3375 8.45676 14.1684L9.68466 9.89177C9.73472 9.70064 9.63298 9.50514 9.44548 9.44961L5.13732 8.15028C4.9383 8.09095 4.7274 8.22783 4.69276 8.43504L3.6205 16.8452L3.38899 19.1488Z" fill="#FF9800"/>
                          <path d="M3.38899 19.1488L3.6205 16.8452L8.08818 14.4522L15.392 9.28687L10.9478 10.0707L9.30716 15.8871C9.2627 16.0565 9.11409 16.1713 8.93845 16.1713H3.89026C3.61691 16.1713 3.40825 15.8716 3.47987 15.6064L3.76195 14.4521L8.08818 14.4522" fill="#FF5722"/>
                          <path d="M12.3616 14.2449L14.9692 9.62573C15.0193 9.53562 15.1282 9.49773 15.2172 9.54855L20.0727 12.0913C20.177 12.1499 20.199 12.2855 20.1194 12.3696L19.0155 13.5493C18.9448 13.6241 18.8289 13.6453 18.7358 13.5984L14.8339 11.5215C14.7443 11.4765 14.6361 11.5144 14.5861 11.6044L12.4899 15.1681C12.4399 15.2581 12.3317 15.296 12.2421 15.2511L10.7481 14.4848C10.6435 14.4326 10.617 14.2965 10.6932 14.2135L12.3616 14.2449Z" fill="#F44336"/>
                          <path d="M15.392 9.28687L8.08818 14.4522L12.3616 14.2449L14.9692 9.62573C15.0193 9.53562 15.1282 9.49773 15.2172 9.54855L20.0727 12.0913" fill="#FFCA28"/>
                          <path d="M20.637 4.10874L19.0155 13.5493C18.9448 13.6241 18.8289 13.6453 18.7358 13.5984L14.8339 11.5215C14.7443 11.4765 14.6361 11.5144 14.5861 11.6044L12.4899 15.1681L11.1486 19.8492C11.1126 19.9554 11.1981 20.0598 11.3016 20.0398L13.3162 19.6738C13.4196 19.6538 13.5052 19.7582 13.4692 19.8644L12.759 21.8121C12.723 21.9183 12.8085 22.0227 12.912 22.0027L14.9266 21.6367C15.03 21.6167 15.1156 21.7211 15.0796 21.8273L14.5361 23.2722C14.5075 23.3556 14.5673 23.4417 14.6524 23.4332L16.0161 23.2639C16.1011 23.2554 16.1687 23.348 16.1321 23.4267L15.4326 24.792C15.3961 24.8706 15.4637 24.9633 15.5486 24.9548L21.0258 24.342C21.3013 24.3118 21.5173 24.0825 21.5291 23.8059L21.9905 4.27753C21.9991 4.08053 21.8173 3.92654 21.6346 4.00011L20.637 4.10874Z" fill="#FFA000"/>
                        </svg>
                        <span>Firebase Test</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
