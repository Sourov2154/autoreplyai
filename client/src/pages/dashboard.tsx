import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import ReviewForm from "@/components/ReviewForm";
import ReviewHistoryList from "@/components/ReviewHistoryList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("new");

  // Redirect to login if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="grid gap-8 mt-8">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoading && !isAuthenticated) {
    // Redirect to login page
    window.location.href = "/api/login";
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Create AI-powered responses to customer reviews
          </p>
        </div>

        <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="new">Generate Response</TabsTrigger>
            <TabsTrigger value="history">Response History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="mt-0">
            <ReviewForm onSuccess={() => setActiveTab("history")} />
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <ReviewHistoryList />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
