import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

import {
  MessageSquareText,
  Settings,
  Star,
  LayoutDashboard,
  Reply,
  ShieldCheck,
  Menu,
  X,
  MessageSquareQuote
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Review Platforms",
      href: "/platforms",
      icon: <Star className="h-5 w-5" />,
    },
    {
      title: "Response History",
      href: "/history",
      icon: <MessageSquareText className="h-5 w-5" />,
    },
    {
      title: "Reply Templates",
      href: "/templates",
      icon: <MessageSquareQuote className="h-5 w-5" />,
    },
    {
      title: "Auto-Response",
      href: "/auto-response",
      icon: <Reply className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="md:hidden fixed top-4 right-4 z-40 p-2 rounded-md bg-primary text-white"
        onClick={toggleMobileMenu}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-white transform transition-transform ease-in-out duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full pt-16 pb-6 px-4 overflow-y-auto">
          <div className="flex-1 flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
              >
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:min-h-screen border-r bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900">AutoReplyAI</span>
            </div>
          </div>
          <nav className="mt-5 flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
              >
                <div
                  className={cn(
                    "group flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}