<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\MenuItem;
use App\Models\Review;
use App\Models\RestaurantPhoto;

class RestaurantController extends Controller
{
    // Get restaurant for current owner

    public function show($id)
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json([
                'error' => 'Restaurant not found',
                'id' => $id
            ], 404);
        }

        return response()->json([
            'id' => $restaurant->id,
            'name' => $restaurant->name,
            'cuisine_type' => $restaurant->cuisine_type,
            'address' => $restaurant->address,
            'phone' => $restaurant->phone,
            'hours' => $restaurant->hours,
            'max_capacity' => (int) $restaurant->max_capacity,
            'current_occupancy' => (int) $restaurant->current_occupancy,
            'occupancy_percentage' => (int) $restaurant->occupancy_percentage,
            'crowd_status' => $restaurant->crowd_status,
            'is_verified' => (bool) $restaurant->is_verified,
            'is_featured' => (bool) $restaurant->is_featured,
            'features' => $restaurant->features ? json_decode($restaurant->features, true) : [],
            'menu_description' => $restaurant->menu_description,
            'average_rating' => $restaurant->average_rating ? (float)$restaurant->average_rating : 0.00,
            'total_reviews' => $restaurant->total_reviews ? (int)$restaurant->total_reviews : 0,
        ]);
    }

    private function getCrowdLevelText($status)
    {
        switch ($status) {
            case 'green':
                return 'Low';
            case 'yellow':
                return 'Moderate';
            case 'orange':
                return 'Busy';
            case 'red':
                return 'Very High';
            default:
                return 'Unknown';
        }
    }

    public function getRestaurantStats($id)
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json(['error' => 'Restaurant not found'], 404);
        }

        // For now, return placeholder stats
        return response()->json([
            'average_rating' => 0,
            'total_reviews' => 0,
            'rating_breakdown' => [],
            'menu_items_count' => 0,
            'photos_count' => 0,
        ]);
    }

    public function getMenuItems($id)
    {
        try {
            // Check if restaurant exists
            $restaurant = Restaurant::find($id);

            if (!$restaurant) {
                return response()->json(['error' => 'Restaurant not found'], 404);
            }

            // Get menu items
            $menuItems = MenuItem::where('restaurant_id', $id)
                ->where('is_available', true)
                ->orderBy('category')
                ->orderBy('name')
                ->get();

            // Return empty array if no menu items
            return response()->json($menuItems);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch menu items',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // public function getReviews($id)
    // {
    //     try {
    //         // Check if restaurant exists
    //         $restaurant = Restaurant::find($id);

    //         if (!$restaurant) {
    //             return response()->json(['error' => 'Restaurant not found'], 404);
    //         }

    //         // Get reviews with user info
    //         $reviews = Review::with('user:id,name')
    //             ->where('restaurant_id', $id)
    //             ->orderBy('created_at', 'desc')
    //             ->get();

    //         return response()->json($reviews);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'error' => 'Failed to fetch reviews',
    //             'message' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function getPhotos($id)
    {
        try {
            // Check if restaurant exists
            $restaurant = Restaurant::find($id);

            if (!$restaurant) {
                return response()->json(['error' => 'Restaurant not found'], 404);
            }

            // Get photos
            $photos = RestaurantPhoto::where('restaurant_id', $id)
                ->orderBy('is_primary', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($photos);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch photos',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    // Get restaurant for current owner - FIXED VERSION
    public function getMyRestaurant()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        // Check if user is a restaurant owner
        if ($user->user_type !== 'restaurant_owner') {
            return response()->json([
                'success' => false,
                'message' => 'You are not a restaurant owner',
                'user_type' => $user->user_type
            ], 403);
        }

        $restaurant = Restaurant::where('owner_id', $user->id)->first();

        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'No restaurant found. Please create one.',
                'needs_setup' => true
            ], 404);
        }

        // Calculate crowd status based on your schema
        $occupancyPercentage = 0;
        if ($restaurant->max_capacity > 0) {
            $occupancyPercentage = round(($restaurant->current_occupancy / $restaurant->max_capacity) * 100);
        }

        // Use your existing crowd_status logic
        $status = $restaurant->crowd_status; // This should already be calculated

        return response()->json([
            'success' => true,
            'restaurant' => $restaurant,
            'crowd_status' => $status,
            'occupancy_percentage' => $occupancyPercentage
        ]);
    }

    // Create or update restaurant
    public function saveRestaurant(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cuisine_type' => 'required|string|max:100',
            'address' => 'required|string',
            'phone' => 'required|string|max:20',
            'hours' => 'required|string|max:100',
            'max_capacity' => 'required|integer|min:1',
            'current_occupancy' => 'required|integer|min:0',
            'features' => 'nullable|array',
            'features.*' => 'string',
            'is_featured' => 'boolean'
        ]);

        $restaurant = Restaurant::updateOrCreate(
            ['owner_id' => $user->id],
            $validated
        );

        $restaurant->refresh();

        return response()->json([
            'message' => 'Restaurant saved successfully',
            'restaurant' => $restaurant,
            'crowd_level' => $restaurant->crowd_level
        ]);
    }

    // Update occupancy (for IoT device)
    public function updateOccupancy(Request $request)
    {
        $user = Auth::user();
        $restaurant = Restaurant::where('owner_id', $user->id)->first();

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        $validated = $request->validate([
            'current_occupancy' => 'required|integer|min:0|max:' . $restaurant->max_capacity
        ]);

        $restaurant->update($validated);
        $restaurant->refresh();

        return response()->json([
            'message' => 'Occupancy updated',
            'restaurant' => $restaurant,
            'crowd_status' => $restaurant->crowd_status,
            'crowd_level' => $restaurant->crowd_level,
            'occupancy_percentage' => $restaurant->occupancy_percentage
        ]);
    }

    /**
     * Request to be featured
     */
    public function requestFeature(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['message' => 'User not authenticated'], 401);
            }

            $restaurant = Restaurant::where('owner_id', $user->id)->first();

            if (!$restaurant) {
                return response()->json(['message' => 'Restaurant not found'], 404);
            }

            $featuredDescription = $request->input('featured_description');

            if (!$featuredDescription || strlen($featuredDescription) < 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'Description must be at least 5 characters'
                ], 422);
            }

            // Simple insert - submitted_at will auto-fill with CURRENT_TIMESTAMP
            $result = DB::table('feature_requests')->insert([
                'restaurant_id' => $restaurant->id,
                'featured_description' => $featuredDescription,
                'status' => 'pending'
                // submitted_at auto-fills
            ]);

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Feature request submitted! Admin will review it shortly.'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save feature request'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feature request: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAllRestaurants()
    {
        try {
            // Get all restaurants with premium ones FIRST
            $restaurants = \App\Models\Restaurant::orderByRaw("subscription_tier = 'premium' DESC")
                ->orderBy('is_featured', 'DESC')
                ->orderBy('is_verified', 'DESC')
                ->orderBy('created_at', 'DESC')
                ->get();

            // Transform for frontend
            $transformedRestaurants = $restaurants->map(function ($restaurant) {
                // Calculate occupancy percentage
                $occupancyPercentage = 0;
                if ($restaurant->max_capacity > 0) {
                    $occupancyPercentage = round(($restaurant->current_occupancy / $restaurant->max_capacity) * 100);
                }

                if ($occupancyPercentage < 40) {
                    $status = 'green';
                    $crowdLevel = 'Low';
                    $waitTime = 5;
                } elseif ($occupancyPercentage < 70) {
                    $status = 'yellow';
                    $crowdLevel = 'Moderate';
                    $waitTime = 15;
                } elseif ($occupancyPercentage < 90) {
                    $status = 'orange';
                    $crowdLevel = 'Busy';
                    $waitTime = 25;
                } else {
                    $status = 'red';
                    $crowdLevel = 'Very High';
                    $waitTime = 30;
                }

                return [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'cuisine' => $restaurant->cuisine_type,
                    'address' => $restaurant->address,
                    'phone' => $restaurant->phone,
                    'hours' => $restaurant->hours,
                    'max_capacity' => $restaurant->max_capacity,
                    'current_occupancy' => $restaurant->current_occupancy,
                    'status' => $status,
                    'crowdLevel' => $crowdLevel,
                    'occupancy' => $occupancyPercentage,
                    'waitTime' => $waitTime,
                    'isFeatured' => $restaurant->is_featured ?? false,
                    'isVerified' => $restaurant->is_verified ?? false,
                    'isPremium' => $restaurant->subscription_tier === 'premium',
                    'subscription_tier' => $restaurant->subscription_tier ?? 'basic',
                    'average_rating' => $restaurant->average_rating ? (float)$restaurant->average_rating : 0.00,
                    'total_reviews' => $restaurant->total_reviews ? (int)$restaurant->total_reviews : 0
                ];
            });

            // Count premium restaurants
            $premiumCount = $restaurants->where('subscription_tier', 'premium')->count();

            return response()->json([
                'restaurants' => $transformedRestaurants,
                'count' => $transformedRestaurants->count(),
                'premium_count' => $premiumCount,
                'featured_count' => $restaurants->where('is_featured', true)->count()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching restaurants: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to fetch restaurants',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getRestaurantById($id)
    {
        $restaurant = Restaurant::with(['owner' => function ($query) {
            $query->select('id', 'name', 'email');
        }])->find($id);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        return response()->json([
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'cuisine' => $restaurant->cuisine_type,
                'address' => $restaurant->address,
                'phone' => $restaurant->phone,
                'hours' => $restaurant->hours,
                'max_capacity' => $restaurant->max_capacity,
                'current_occupancy' => $restaurant->current_occupancy,
                'status' => $restaurant->crowd_status,
                'crowdLevel' => $restaurant->crowd_level,
                'occupancy' => $restaurant->occupancy_percentage,
                'waitTime' => $restaurant->estimated_wait_time,
                'isFeatured' => $restaurant->is_featured ?? false,
                'features' => $restaurant->features ?? [],
                'average_rating' => $restaurant->average_rating ? (float)$restaurant->average_rating : 0.00,
                'total_reviews' => $restaurant->total_reviews ? (int)$restaurant->total_reviews : 0,
                'created_at' => $restaurant->created_at,
                'updated_at' => $restaurant->updated_at,
            ]
        ]);
    }

    public function requestVerification(Request $request)
    {
        try {
            $user = Auth::user();

            // Check if user is restaurant owner
            if ($user->user_type !== 'restaurant_owner') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only restaurant owners can request verification'
                ], 403);
            }

            $restaurant = Restaurant::where('owner_id', $user->id)->first();

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant not found'
                ], 404);
            }

            // Validate request
            $request->validate([
                'verification_request' => 'required|string|min:50|max:1000'
            ]);

            // Update restaurant verification request
            $restaurant->update([
                'verification_status' => 'pending',
                'verification_request' => $request->verification_request,
                'verification_requested_at' => now(),
                'is_verified' => false // Ensure not verified yet
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verification request submitted successfully',
                'restaurant' => $restaurant
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit verification request'
            ], 500);
        }
    }
}
