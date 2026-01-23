<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    /**
     * Get premium restaurant recommendations
     */
    public function getPremiumRecommendations(Request $request)
    {
        try {
            $excludeId = $request->get('exclude_id');
            $limit = $request->get('limit', 5);

            // Get random premium restaurants
            $query = Restaurant::where('subscription_tier', 'premium')
                // ->where('is_verified', true)
                ->whereNotNull('name')
                ->where('name', '!=', '');

            // Exclude current restaurant if provided
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            // Get random restaurants
            $restaurants = $query->inRandomOrder()
                ->limit($limit)
                ->get();

            // Transform for frontend
            $transformedRestaurants = $restaurants->map(function ($restaurant) {
                // Calculate occupancy percentage
                $occupancyPercentage = 0;
                if ($restaurant->max_capacity > 0) {
                    $occupancyPercentage = round(($restaurant->current_occupancy / $restaurant->max_capacity) * 100);
                }

                // Calculate crowd status
                if ($occupancyPercentage < 40) {
                    $status = 'green';
                    $crowdLevel = 'Low';
                } elseif ($occupancyPercentage < 70) {
                    $status = 'yellow';
                    $crowdLevel = 'Moderate';
                } elseif ($occupancyPercentage < 90) {
                    $status = 'orange';
                    $crowdLevel = 'Busy';
                } else {
                    $status = 'red';
                    $crowdLevel = 'Full';
                }

                return [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'cuisine' => $restaurant->cuisine_type,
                    'address' => $restaurant->address,
                    'status' => $status,
                    'crowdLevel' => $crowdLevel,
                    'occupancy' => $occupancyPercentage,
                    'isPremium' => true,
                    'isVerified' => $restaurant->is_verified,
                    'average_rating' => $restaurant->average_rating ? (float)$restaurant->average_rating : 0,
                    'total_reviews' => $restaurant->total_reviews ? (int)$restaurant->total_reviews : 0,
                    'subscription_tier' => $restaurant->subscription_tier, // This is CRITICAL!
                ];
            });

            return response()->json([
                'success' => true,
                'recommendations' => $transformedRestaurants,
                'count' => $transformedRestaurants->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recommendations'
            ], 500);
        }
    }
}
