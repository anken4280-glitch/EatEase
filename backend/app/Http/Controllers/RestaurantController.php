<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage; // ← ADD THIS LINE
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\MenuItem;
use App\Models\Review;
use App\Models\RestaurantPhoto;
use App\Models\UserNotification;
// use App\Models\NotificationLog;
use Illuminate\Support\Facades\Schema;
use Exception; // ← ADD THIS


class RestaurantController extends Controller
{
    // Get restaurant for current owner

    public function show($id)
    {
        return $this->getRestaurantById($id);
    }


    // RestaurantController.php
    public function uploadImage(Request $request, $type)
    {
        // Manual validation - avoid Laravel's validate() which might fail on PHP 7.4
        if (!$request->hasFile('image')) {
            return response()->json([
                'success' => false,
                'message' => 'No image file provided'
            ], 422);
        }

        $file = $request->file('image');

        // Check file size (5MB max)
        if ($file->getSize() > 5242880) {
            return response()->json([
                'success' => false,
                'message' => 'File too large. Maximum size is 5MB.'
            ], 422);
        }

        // Check file type manually
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $mime = $file->getMimeType();

        if (!in_array($mime, $allowedMimes)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
            ], 422);
        }

        // Get authenticated user
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Not authenticated'
            ], 401);
        }

        // Find restaurant
        $restaurant = Restaurant::where('owner_id', $user->id)->first();
        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found for this user'
            ], 404);
        }

        try {
            // Create directory if it doesn't exist
            $directory = "restaurant-{$type}s";
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }

            // Generate unique filename
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs($directory, $filename, 'public');

            // Delete old image if exists
            if ($type === 'profile' && $restaurant->profile_image) {
                Storage::disk('public')->delete($restaurant->profile_image);
            } elseif ($type === 'banner' && $restaurant->banner_image) {
                Storage::disk('public')->delete($restaurant->banner_image);
            }

            // Update restaurant
            if ($type === 'profile') {
                $restaurant->profile_image = $path;
            } elseif ($type === 'banner') {
                $restaurant->banner_image = $path;
                $restaurant->banner_position = $request->input('position', 'center');
            }

            $restaurant->save();

            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' image uploaded successfully',
                'path' => $path,
                'url' => url('/storage/' . $path)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
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
                return 'Full';
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
    // Update occupancy (for IoT device) - MODIFIED VERSION
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

        // Get old crowd level before update
        $oldCrowdLevel = $restaurant->crowd_level;

        // Update restaurant
        $restaurant->update($validated);
        $restaurant->refresh();

        // Get new crowd level after update
        $newCrowdLevel = $restaurant->crowd_level;

        // TRIGGER NOTIFICATIONS IF CROWD LEVEL CHANGED
        if ($oldCrowdLevel !== $newCrowdLevel) {
            $this->triggerCrowdNotifications($restaurant, $newCrowdLevel);
        }

        return response()->json([
            'message' => 'Occupancy updated',
            'restaurant' => $restaurant,
            'crowd_status' => $restaurant->crowd_status,
            'crowd_level' => $restaurant->crowd_level,
            'occupancy_percentage' => $restaurant->occupancy_percentage,
            'old_level' => $oldCrowdLevel,
            'new_level' => $newCrowdLevel
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

    // In RestaurantController.php - UPDATED getAllRestaurants method
    public function getAllRestaurants(Request $request)
    {
        try {
            $query = Restaurant::query();

            // Apply filters if provided
            // 1. CUISINE FILTER
            if ($request->has('cuisine') && $request->cuisine !== 'all' && $request->cuisine !== '') {
                $query->where('cuisine_type', $request->cuisine);
            }

            // 2. CROWD STATUS FILTER
            if ($request->has('crowd_status')) {
                $statuses = is_array($request->crowd_status) ? $request->crowd_status : [$request->crowd_status];
                if (!empty($statuses)) {
                    $query->whereIn('crowd_status', $statuses);
                }
            }

            // 3. RATING FILTER
            if ($request->has('min_rating')) {
                $query->where('average_rating', '>=', (float)$request->min_rating);
            }

            // 4. TIER FILTER
            if ($request->has('tier') && $request->tier !== 'all') {
                $query->where('subscription_tier', $request->tier);
            }

            // 5. FEATURED FILTER (optional)
            if ($request->has('featured') && $request->featured === 'true') {
                $query->where('is_featured', true);
            }

            // Get restaurants with premium ones FIRST
            $restaurants = $query->orderByRaw("subscription_tier = 'premium' DESC")
                ->orderBy('is_featured', 'DESC')
                ->orderBy('is_verified', 'DESC')
                ->orderBy('created_at', 'DESC')
                ->get();

            // Transform for frontend (your existing transformation code)
            $transformedRestaurants = $restaurants->map(function ($restaurant) use ($request) {
                // Keep your existing transformation logic...
                // [YOUR EXISTING TRANSFORMATION CODE HERE]

                return [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'cuisine' => $restaurant->cuisine_type,
                    'cuisine_type' => $restaurant->cuisine_type, // Add this for consistency
                    'address' => $restaurant->address,
                    'phone' => $restaurant->phone,
                    'hours' => $restaurant->hours,
                    'max_capacity' => $restaurant->max_capacity,
                    'current_occupancy' => $restaurant->current_occupancy,
                    'status' => $restaurant->crowd_status,
                    'crowdLevel' => $this->getCrowdLevelText($restaurant->crowd_status),
                    'occupancy' => $restaurant->occupancy_percentage,
                    'waitTime' => $this->calculateWaitTime($restaurant->occupancy_percentage),
                    'isFeatured' => $restaurant->is_featured ?? false,
                    'isVerified' => $restaurant->is_verified ?? false,
                    'isPremium' => $restaurant->subscription_tier === 'premium',
                    'subscription_tier' => $restaurant->subscription_tier ?? 'basic',
                    'banner_image' => $restaurant->banner_image
                        ? Storage::url($restaurant->banner_image)
                        : null,
                    'profile_image' => $restaurant->profile_image
                        ? Storage::url($restaurant->profile_image)
                        : null,
                    'banner_position' => $restaurant->banner_position,
                    'average_rating' => $restaurant->average_rating ? (float)$restaurant->average_rating : 0.00,
                    'total_reviews' => $restaurant->total_reviews ? (int)$restaurant->total_reviews : 0
                ];
            });

            // Counts for statistics
            $premiumCount = $restaurants->where('subscription_tier', 'premium')->count();
            $featuredCount = $restaurants->where('is_featured', true)->count();

            // Get unique cuisines from filtered results
            $availableCuisines = $restaurants->pluck('cuisine_type')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            return response()->json([
                'restaurants' => $transformedRestaurants,
                'count' => $transformedRestaurants->count(),
                'premium_count' => $premiumCount,
                'featured_count' => $featuredCount,
                'filters' => [
                    'available_cuisines' => $availableCuisines,
                    'applied_filters' => $request->all()
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching restaurants: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch restaurants',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Add this helper method to RestaurantController class
    private function calculateWaitTime($occupancyPercentage)
    {
        if ($occupancyPercentage < 40) {
            return 5;
        } elseif ($occupancyPercentage < 70) {
            return 15;
        } elseif ($occupancyPercentage < 90) {
            return 25;
        } else {
            return 30;
        }
    }

    // Add this method to RestaurantController.php
    public function getAvailableCuisines()
    {
        try {
            // Get all distinct cuisine types from restaurants
            $cuisines = Restaurant::whereNotNull('cuisine_type')
                ->where('cuisine_type', '!=', '')
                ->select('cuisine_type')
                ->distinct()
                ->orderBy('cuisine_type')
                ->pluck('cuisine_type')
                ->filter() // Remove empty values
                ->values() // Reset keys
                ->toArray();

            return response()->json([
                'success' => true,
                'cuisines' => $cuisines,
                'count' => count($cuisines)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch cuisines: ' . $e->getMessage()
            ], 500);
        }
    }

    ///
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
                'profile_image' => $restaurant->profile_image
                    ? Storage::url($restaurant->profile_image)
                    : null,
                'banner_image' => $restaurant->banner_image
                    ? Storage::url($restaurant->banner_image)
                    : null,
                'banner_position' => $restaurant->banner_position ?? 'center',
            ]
        ]);
    }

    public function updateCrowdLevel(Request $request, $id)
    {
        try {
            $restaurant = Restaurant::findOrFail($id);

            // Check if user owns the restaurant
            if ($request->user()->id !== $restaurant->owner_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validated = $request->validate([
                'crowd_level' => 'required|in:green,yellow,orange,red'
            ]);

            $oldLevel = $restaurant->crowd_level;
            $newLevel = $validated['crowd_level'];

            // Update the restaurant
            $restaurant->crowd_level = $newLevel;
            $restaurant->last_updated = now();
            $restaurant->save();

            // TRIGGER NOTIFICATIONS
            if ($oldLevel !== $newLevel) {
                $notificationCount = $this->triggerCrowdNotifications($restaurant, $newLevel);

                Log::info("Crowd level changed for restaurant {$restaurant->id} from {$oldLevel} to {$newLevel}. Notifications sent: {$notificationCount}");
            }

            return response()->json([
                'success' => true,
                'message' => 'Crowd level updated',
                'restaurant' => $restaurant,
                'old_level' => $oldLevel,
                'new_level' => $newLevel,
                'notification_count' => $notificationCount ?? 0
            ]);
        } catch (\Exception $e) {
            Log::error('Update crowd level error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update crowd level'
            ], 500);
        }
    }

    private function triggerCrowdNotifications($restaurant, $newLevel)
    {
        try {
            // Find users who want notifications for this status
            $notifications = UserNotification::where('restaurant_id', $restaurant->id)
                ->where('notify_when_status', $newLevel)
                ->where('is_active', true)
                ->with('user')
                ->get();

            $sentCount = 0;

            foreach ($notifications as $notification) {
                // Create notification record for each user
                $this->createNotificationRecord($notification->user, $restaurant, $newLevel);
                $sentCount++;

                Log::info("Notification sent to user {$notification->user->id} " .
                    "about restaurant {$restaurant->name} " .
                    "reaching {$newLevel} status");
            }

            return $sentCount;
        } catch (\Exception $e) {
            Log::error('Trigger notifications error: ' . $e->getMessage());
            return 0;
        }
    }

    private function createNotificationRecord($user, $restaurant, $status)
    {
        try {
            // Check if notification_logs table exists
            if (!Schema::hasTable('notification_logs')) {
                // Create the table if it doesn't exist
                $this->createNotificationLogsTable();
            }

            // Create notification log
            DB::table('notification_logs')->insert([
                'user_id' => $user->id,
                'restaurant_id' => $restaurant->id,
                'notification_type' => 'crowd_alert',
                'title' => 'Crowd Level Alert',
                'message' => $restaurant->name . ' has reached ' . $this->getCrowdLevelText($status) . ' crowd level',
                'status' => $status,
                'read' => false,
                'sent_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } catch (\Exception $e) {
            Log::error('Create notification record error: ' . $e->getMessage());
        }
    }

    private function createNotificationLogsTable()
    {
        try {
            DB::statement("
                CREATE TABLE IF NOT EXISTS notification_logs (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT UNSIGNED NOT NULL,
                    restaurant_id BIGINT UNSIGNED NOT NULL,
                    notification_type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    status ENUM('green', 'yellow', 'orange', 'red') NULL,
                    `read` BOOLEAN DEFAULT FALSE,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP NULL DEFAULT NULL,
                    updated_at TIMESTAMP NULL DEFAULT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                    INDEX idx_user_read (user_id, `read`, sent_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            Log::info('Created notification_logs table');
        } catch (\Exception $e) {
            Log::error('Failed to create notification_logs table: ' . $e->getMessage());
        }
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

    public function getRestaurantCurrentStatus($id)
    {
        try {
            $restaurant = Restaurant::find($id);

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'restaurant' => [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'crowd_level' => $restaurant->crowd_level,
                    'current_occupancy' => $restaurant->current_occupancy,
                    'max_capacity' => $restaurant->max_capacity,
                    'occupancy_percentage' => $restaurant->occupancy_percentage,
                    'updated_at' => $restaurant->updated_at
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get restaurant status error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get restaurant status'
            ], 500);
        }
    }
}
