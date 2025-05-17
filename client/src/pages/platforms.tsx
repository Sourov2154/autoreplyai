import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Platform, platformFormSchema, type PlatformFormData } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Loader2, 
  Plus, 
  Save, 
  Trash, 
  Edit, 
  ExternalLink 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SiGoogle, SiYelp, SiTripadvisor, SiFacebook } from "react-icons/si";

// Platform icons map
const PLATFORM_ICONS = {
  "Google Business": <SiGoogle className="h-5 w-5 text-blue-500" />,
  "Yelp": <SiYelp className="h-5 w-5 text-red-500" />,
  "TripAdvisor": <SiTripadvisor className="h-5 w-5 text-green-500" />,
  "Facebook": <SiFacebook className="h-5 w-5 text-blue-600" />,
};

export default function PlatformsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<Platform | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch platforms
  const { data: platforms = [], isLoading: platformsLoading } = useQuery({
    queryKey: ['/api/platforms'],
    enabled: isAuthenticated,
  });

  // Form setup
  const form = useForm<PlatformFormData>({
    resolver: zodResolver(platformFormSchema),
    defaultValues: {
      platformName: "",
      platformId: "",
      accessToken: "",
      refreshToken: "",
    },
  });

  // Add platform mutation
  const { mutate: addPlatform, isPending: isAddingPlatform } = useMutation({
    mutationFn: async (data: PlatformFormData) => {
      return apiRequest('/api/platforms', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platforms'] });
      toast({
        title: "Platform added",
        description: "The platform has been added successfully.",
      });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Failed to add platform",
        description: "There was an error adding the platform. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete platform mutation
  const { mutate: deletePlatform, isPending: isDeletingPlatform } = useMutation({
    mutationFn: async (platformId: number) => {
      return apiRequest(`/api/platforms/${platformId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platforms'] });
      toast({
        title: "Platform deleted",
        description: "The platform has been deleted successfully.",
      });
      setPlatformToDelete(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete platform",
        description: "There was an error deleting the platform. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: PlatformFormData) => {
    addPlatform(data);
  };

  // Loading state
  if (authLoading || platformsLoading) {
    return (
      <DashboardLayout pageTitle="Review Platforms">
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Review Platforms">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">Connected Platforms</h2>
            <p className="text-sm text-muted-foreground">
              Manage platforms where your business receives customer reviews
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Platform
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Review Platform</DialogTitle>
                <DialogDescription>
                  Connect a review platform to automatically fetch and respond to customer reviews.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="platformName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Google Business">Google Business</SelectItem>
                            <SelectItem value="Yelp">Yelp</SelectItem>
                            <SelectItem value="TripAdvisor">TripAdvisor</SelectItem>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="platformId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business ID/Page ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your business ID on the platform" />
                        </FormControl>
                        <FormDescription>
                          This is your unique business identifier on the platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accessToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Token (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Enter access token" />
                        </FormControl>
                        <FormDescription>
                          API access token for the platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="refreshToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refresh Token (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Enter refresh token" />
                        </FormControl>
                        <FormDescription>
                          API refresh token for the platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isAddingPlatform}
                    >
                      {isAddingPlatform ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Add Platform
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {platforms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-center mb-2">No Platforms Connected</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You haven't connected any review platforms yet. Add a platform to start managing your reviews.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Platform
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>Your connected review platforms</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Business ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Connected On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((platform) => (
                    <TableRow key={platform.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {PLATFORM_ICONS[platform.platformName as keyof typeof PLATFORM_ICONS] || 
                            <AlertCircle className="h-5 w-5 text-gray-400" />}
                          <span className="ml-2">{platform.platformName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{platform.platformId}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Active
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(platform.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                          </Button>
                          <AlertDialog open={platformToDelete?.id === platform.id}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setPlatformToDelete(platform)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Platform</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this platform? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setPlatformToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => {
                                    if (platformToDelete) {
                                      deletePlatform(platformToDelete.id);
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {isDeletingPlatform ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Status</AlertTitle>
          <AlertDescription>
            AutoReplyAI will check for new reviews every 5 minutes on your connected platforms.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}