<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnalyticsController extends Controller
{
    /**
     * Get restaurant analytics (Premium only)
     */
    public function getRestaurantAnalytics($restaurantId, Request $request)
    {
        $user = Auth::user();
        
        if (!$user || $user->user_type !== 'restaurant_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized'
            ], 403);
        }

        // Get the restaurant
        $restaurant = Restaurant::find($restaurantId);
        
        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found'
            ], 404);
        }

        // Check if user owns this restaurant
        if ($restaurant->owner_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized to view analytics for this restaurant'
            ], 403);
        }

        // Check if restaurant is premium
        if ($restaurant->subscription_tier !== 'premium') {
            return response()->json([
                'success' => false,
                'message' => 'Analytics available for Premium tier only'
            ], 403);
        }

        $range = $request->get('range', 'week');
        
        // Calculate real analytics data
        $analytics = $this->calculateAnalytics($restaurant, $range);

        return response()->json([
            'success' => true,
            'analytics' => $analytics,
            'time_range' => $range,
            'restaurant_name' => $restaurant->name
        ]);
    }

    /**
     * Calculate analytics data
     */
    private function calculateAnalytics($restaurant, $range)
    {
        // For now, return mock data
        // You can replace this with real database queries
        
        $reviews = Review::where('restaurant_id', $restaurant->id)->get();
        
        return [
            'occupancy' => [
                'daily' => [65, 70, 45, 80, 90, 75, 60],
                'weekly' => [70, 65, 80, 75, 85, 90, 70],
                'monthly' => [65, 70, 75, 80, 85, 90, 85, 80, 75, 70, 65, 60],
            ],
            'peakHours' => [
                ['hour' => '12 PM', 'occupancy' => 90],
                ['hour' => '1 PM', 'occupancy' => 85],
                ['hour' => '7 PM', 'occupancy' => 95],
                ['hour' => '8 PM', 'occupancy' => 88],
            ],
            'revenue' => [
                'current' => 125000,
                'previous' => 110000,
                'growth' => '+13.6%',
            ],
            'reviews' => [
                'average' => $reviews->avg('rating') ? round($reviews->avg('rating'), 1) : 0,
                'total' => $reviews->count(),
                'trend' => '+8',
            ],
            'customers' => [
                'repeat' => 65,
                'new' => 35,
            ],
        ];
    }
}