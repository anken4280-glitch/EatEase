<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubscriptionController extends Controller
{
    /**
     * Get current subscription tier
     */
    public function getCurrentTier(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->user_type !== 'restaurant_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized'
            ], 403);
        }

        $restaurant = Restaurant::where('owner_id', $user->id)->first();

        // If no restaurant exists, return Basic tier by default
        if (!$restaurant) {
            return response()->json([
                'success' => true,
                'tier' => 'basic',
                'is_premium' => false,
                'can_be_featured' => false,
                'subscription_ends_at' => null,
                'needs_setup' => true, // Tell frontend to create restaurant first
            ]);
        }

        return response()->json([
            'success' => true,
            'tier' => $restaurant->subscription_tier,
            'is_premium' => $restaurant->subscription_tier === 'premium',
            'can_be_featured' => $restaurant->can_be_featured,
            'subscription_ends_at' => $restaurant->subscription_ends_at,
            'needs_setup' => false,
        ]);
    }

    /**
     * Upgrade to Premium (direct upgrade for now)
     */
    public function upgradeToPremium()
    {
        $user = Auth::user();

        if (!$user || $user->user_type !== 'restaurant_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized'
            ], 403);
        }

        $restaurant = Restaurant::where('owner_id', $user->id)->first();

        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found'
            ], 404);
        }

        if ($restaurant->isPremium()) {
            return response()->json([
                'success' => false,
                'message' => 'Already on Premium tier'
            ], 400);
        }

        $restaurant->upgradeToPremium();

        return response()->json([
            'success' => true,
            'message' => 'Successfully upgraded to Premium tier!',
            'tier' => 'premium',
            'subscription_ends_at' => $restaurant->subscription_ends_at,
        ]);
    }

    /**
     * Check if restaurant can apply for featured status
     */
    public function canApplyForFeatured()
    {
        $user = Auth::user();

        if (!$user || $user->user_type !== 'restaurant_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized'
            ], 403);
        }

        $restaurant = Restaurant::where('owner_id', $user->id)->first();

        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'can_apply' => $restaurant->can_be_featured,
            'tier' => $restaurant->subscription_tier,
        ]);
    }
}
