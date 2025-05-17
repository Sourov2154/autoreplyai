import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { reviewFormSchema, type ReviewFormData } from "@shared/schema";
import ResponseDisplay from "./ResponseDisplay";

interface ReviewFormProps {
  onSuccess?: () => void;
}

const ReviewForm = ({ onSuccess }: ReviewFormProps) => {
  const { toast } = useToast();
  const [response, setResponse] = useState<string | null>(null);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      reviewText: "",
      starRating: 4,
      responseTone: "Professional",
    },
  });

  const createReview = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResponse(data.responseText);
      toast({
        title: "Success!",
        description: "Your AI response has been generated.",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ReviewFormData) {
    createReview.mutate(data);
  }

  const renderStarOptions = () => {
    return Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
      <SelectItem key={num} value={num.toString()}>
        {num} {num === 1 ? "star" : "stars"}
      </SelectItem>
    ));
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Generate Review Response</h2>
          <p className="text-gray-600">Enter a customer review and we'll generate an appropriate response</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="reviewText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Review</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the customer review here..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the customer's review text that you want to respond to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="starRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Star Rating</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select star rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {renderStarOptions()}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How many stars did the customer give?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="responseTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Tone</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select response tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Friendly">Friendly</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Apologetic">Apologetic</SelectItem>
                          <SelectItem value="Cheerful">Cheerful</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the tone for your response
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={createReview.isPending}
              >
                {createReview.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Response...
                  </span>
                ) : (
                  "Generate Response"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {response && (
        <ResponseDisplay responseText={response} />
      )}
    </div>
  );
};

export default ReviewForm;
