import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and site name */}
          <a href="/" className="flex items-center">
            <span className="text-blue-600 text-2xl font-bold">ReviewReplier</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className={`text-gray-700 hover:text-blue-600 font-medium ${location === "/" ? "text-blue-600" : ""}`}>
              Home
            </a>
            {isAuthenticated && (
              <a href="/dashboard" className={`text-gray-700 hover:text-blue-600 font-medium ${location === "/dashboard" ? "text-blue-600" : ""}`}>
                Dashboard
              </a>
            )}
          </nav>

          {/* Auth Buttons / User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <span>My Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <a href="/dashboard" className="w-full">Dashboard</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/api/logout" className="w-full">Sign Out</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a href="/api/login">
                <Button>Sign In</Button>
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-4 px-4 bg-white border-t border-gray-200">
          <nav className="flex flex-col space-y-4">
            <a
              href="/"
              className={`text-gray-700 hover:text-blue-600 font-medium ${location === "/" ? "text-blue-600" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            
            {isAuthenticated && (
              <a
                href="/dashboard"
                className={`text-gray-700 hover:text-blue-600 font-medium ${
                  location === "/dashboard" ? "text-blue-600" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </a>
            )}
            
            {isAuthenticated ? (
              <a
                href="/api/logout"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Out
              </a>
            ) : (
              <a
                href="/api/login"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
