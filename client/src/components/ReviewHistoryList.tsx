import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ResponseDisplay from "./ResponseDisplay";
import { Review } from "@shared/schema";

const ReviewHistoryItem = ({ review }: { review: Review }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Customer Review</CardTitle>
            <CardDescription>
              {new Date(review.createdAt).toLocaleDateString()} - {review.responseTone} tone
            </CardDescription>
          </div>
          <Badge>
            {review.starRating} {review.starRating === 1 ? 'star' : 'stars'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <p className="text-gray-700">{review.reviewText}</p>
        </div>
        {review.responseText && (
          <ResponseDisplay responseText={review.responseText} />
        )}
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const ReviewHistoryList = () => {
  const { data: reviews, isLoading, error } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was a problem loading your review history. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>No Reviews Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You haven't generated any review responses yet. Create a new response to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewHistoryItem key={review.id} review={review} />
      ))}
    </div>
  );
};

export default ReviewHistoryList;
