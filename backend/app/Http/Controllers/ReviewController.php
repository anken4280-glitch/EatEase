<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    // Get all reviews for a restaurant (public)
    // In ReviewController.php - Update the index method
    public function index($restaurantId)
    {
        // Check if restaurant exists first
        $restaurant = Restaurant::find($restaurantId);

        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'error' => 'Restaurant not found'
            ], 404);
        }

        $reviews = Review::with('user:id,name')
            ->where('restaurant_id', $restaurantId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate average rating
        $averageRating = Review::where('restaurant_id', $restaurantId)->avg('rating');

        // Get user's review if logged in
        $userReview = null;
        if (Auth::check()) {
            $userReview = Review::where('restaurant_id', $restaurantId)
                ->where('user_id', Auth::id())
                ->first();
        }

        return response()->json([
            'success' => true,
            'reviews' => $reviews,
            'average_rating' => round($averageRating, 1),
            'total_reviews' => $reviews->count(),
            'user_review' => $userReview
        ]);
    }

    // Submit a review (diner only)
    public function store(Request $request, $restaurantId)
    {
        // Only diners can review
        if (Auth::user()->user_type !== 'diner') {
            return response()->json(['error' => 'Only diners can submit reviews'], 403);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000'
        ]);

        // Check if user already reviewed (you have unique constraint but let's check)
        $existingReview = Review::where('restaurant_id', $restaurantId)
            ->where('user_id', Auth::id())
            ->first();

        if ($existingReview) {
            // Update existing review
            $existingReview->update([
                'rating' => $request->rating,
                'comment' => $request->comment
            ]);

            $this->updateRestaurantStats($restaurantId);

            return response()->json([
                'success' => true,
                'message' => 'Review updated successfully',
                'review' => $existingReview
            ]);
        }

        // Create new review
        $review = Review::create([
            'restaurant_id' => $restaurantId,
            'user_id' => Auth::id(),
            'rating' => $request->rating,
            'comment' => $request->comment
        ]);

        $this->updateRestaurantStats($restaurantId);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully',
            'review' => $review
        ]);
    }

    // Delete a review
    public function destroy($id)
    {
        $review = Review::findOrFail($id);

        // Check if user owns the review or is admin
        if (Auth::id() !== $review->user_id && Auth::user()->user_type !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $restaurantId = $review->restaurant_id;
        $review->delete();

        $this->updateRestaurantStats($restaurantId);

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully'
        ]);
    }

    // Helper: Update restaurant average rating
    private function updateRestaurantStats($restaurantId)
    {
        $averageRating = Review::where('restaurant_id', $restaurantId)->avg('rating');
        $totalReviews = Review::where('restaurant_id', $restaurantId)->count();

        $restaurant = Restaurant::find($restaurantId);
        if ($restaurant) {
            $restaurant->average_rating = round($averageRating, 1);
            $restaurant->total_reviews = $totalReviews;
            $restaurant->save();
        }
    }
}
