import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your review response dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col space-y-4">
              <p className="text-center text-sm text-gray-600">
                Log in with your account to manage review responses and view your history.
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              size="lg"
              disabled={isLoading}
              onClick={() => window.location.href = "/api/login"}
            >
              {isLoading ? "Loading..." : "Sign In"}
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
