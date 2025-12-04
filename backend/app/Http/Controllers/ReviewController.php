<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function addReview(Request $request, $restaurantId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Check if user already reviewed
        $existingReview = Review::where('user_id', Auth::id())
            ->where('restaurant_id', $restaurantId)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this restaurant'
            ], 400);
        }

        $review = Review::create([
            'restaurant_id' => $restaurantId,
            'user_id' => Auth::id(),
            'rating' => $request->rating,
            'comment' => $request->comment,
            'images' => $request->images ? json_decode($request->images) : null,
        ]);

        return response()->json([
            'message' => 'Review added successfully',
            'review' => $review
        ], 201);
    }

    public function updateReview(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        
        // Check if user owns the review
        if ($review->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'sometimes|nullable|string|max:1000',
        ]);

        $review->update($request->only(['rating', 'comment']));

        return response()->json([
            'message' => 'Review updated successfully',
            'review' => $review
        ]);
    }

    public function deleteReview($id)
    {
        $review = Review::findOrFail($id);
        
        // Check if user owns the review or is admin
        if ($review->user_id !== Auth::id() && !Auth::user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully'
        ]);
    }
}