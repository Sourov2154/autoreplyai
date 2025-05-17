import { useState } from "react";
import { format } from "date-fns";
import { Review } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { StarRating } from "./StarRating";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquareText, RefreshCcw } from "lucide-react";

interface ReviewItemProps {
  review: Review;
  onResponseUpdate?: (updatedReview: Review) => void;
}

const formatDate = (date: Date | string | null) => {
  if (!date) return "N/A";
  return format(new Date(date), "MMM dd, yyyy");
};

const getToneColor = (tone: string) => {
  switch (tone) {
    case "Friendly": return "bg-green-100 text-green-800";
    case "Professional": return "bg-blue-100 text-blue-800";
    case "Apologetic": return "bg-purple-100 text-purple-800";
    case "Enthusiastic": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export function ReviewItem({ review, onResponseUpdate }: ReviewItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [responseText, setResponseText] = useState(review.responseText || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateResponse = async () => {
    if (!responseText.trim()) {
      toast({ 
        title: "Error", 
        description: "Response cannot be empty",
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedReview = await apiRequest<Review>(`/api/reviews/${review.id}`, {
        method: "PUT",
        body: JSON.stringify({ responseText }),
      });
      
      if (onResponseUpdate) {
        onResponseUpdate(updatedReview);
      }
      
      setIsEditing(false);
      toast({ 
        title: "Success", 
        description: "Response updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              {review.customerName || "Anonymous Customer"}
              <StarRating rating={review.starRating} className="ml-2" />
            </CardTitle>
            <CardDescription>
              {formatDate(review.createdAt)}
              {review.platformId && (
                <Badge variant="outline" className="ml-2">
                  {review.platformName || "Platform"}
                </Badge>
              )}
            </CardDescription>
          </div>
          {review.responseTone && (
            <Badge className={getToneColor(review.responseTone)}>
              {review.responseTone}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Review</p>
            <p className="text-gray-700">{review.reviewText}</p>
          </div>

          {review.responseText && !isEditing && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                <MessageSquareText className="h-4 w-4 mr-1" />
                Response
                {review.autoResponded && (
                  <Badge variant="outline" className="ml-2 text-xs">Auto-generated</Badge>
                )}
              </p>
              <p className="text-gray-700">{review.responseText}</p>
            </div>
          )}

          {isEditing && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Edit Response</p>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[120px]"
                placeholder="Write your response here..."
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {!isEditing ? (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setResponseText(review.responseText || "");
                setIsEditing(true);
              }}
            >
              {review.responseText ? "Edit Response" : "Add Response"}
            </Button>

            {review.responseText && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Regenerate Response</DialogTitle>
                    <DialogDescription>
                      This will generate a new AI response for this review. Do you want to continue?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button onClick={() => {}}>Regenerate</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleUpdateResponse}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Response"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}