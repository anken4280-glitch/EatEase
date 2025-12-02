<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Restaurant;
use App\Models\UserNotification;
use App\Models\Bookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    // ========== BOOKMARK METHODS ==========
    
    /**
     * Toggle bookmark for a restaurant
     */
    public function toggleBookmark($restaurant_id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'User not authenticated'], 401);
            }
            
            // Check if restaurant exists
            $restaurant = Restaurant::find($restaurant_id);
            if (!$restaurant) {
                return response()->json(['message' => 'Restaurant not found'], 404);
            }
            
            // Check if already bookmarked
            $bookmark = Bookmark::where('user_id', $user->id)
                ->where('restaurant_id', $restaurant_id)
                ->first();
            
            if ($bookmark) {
                // Remove bookmark
                $bookmark->delete();
                $isBookmarked = false;
                $message = 'Bookmark removed';
            } else {
                // Add bookmark
                Bookmark::create([
                    'user_id' => $user->id,
                    'restaurant_id' => $restaurant_id,
                ]);
                $isBookmarked = true;
                $message = 'Bookmark added';
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'isBookmarked' => $isBookmarked,
                'bookmarkCount' => Bookmark::where('restaurant_id', $restaurant_id)->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Toggle bookmark error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update bookmark',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get user's bookmarked restaurants
     */
    public function getBookmarks()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'User not authenticated'], 401);
            }
            
            $bookmarks = Bookmark::with(['restaurant' => function($query) {
                $query->select('id', 'name', 'cuisine_type', 'address', 'phone', 'hours');
            }])
            ->where('user_id', $user->id)
            ->get()
            ->map(function($bookmark) {
                return [
                    'id' => $bookmark->id,
                    'restaurant_id' => $bookmark->restaurant_id,
                    'restaurant_name' => $bookmark->restaurant->name,
                    'cuisine' => $bookmark->restaurant->cuisine_type,
                    'address' => $bookmark->restaurant->address,
                    'created_at' => $bookmark->created_at
                ];
            });
            
            return response()->json([
                'success' => true,
                'bookmarks' => $bookmarks,
                'count' => $bookmarks->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get bookmarks error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch bookmarks',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    // ========== NOTIFICATION METHODS ==========
    
    /**
     * Set notification preference for a restaurant
     */
    public function setNotification(Request $request, $restaurant_id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'User not authenticated'], 401);
            }
            
            // Validate request
            $validated = $request->validate([
                'notify_when_status' => 'required|in:green,yellow,orange,red'
            ]);
            
            // Check if restaurant exists
            $restaurant = Restaurant::find($restaurant_id);
            if (!$restaurant) {
                return response()->json(['message' => 'Restaurant not found'], 404);
            }
            
            // Check if notification already exists
            $notification = UserNotification::where('user_id', $user->id)
                ->where('restaurant_id', $restaurant_id)
                ->first();
            
            if ($notification) {
                // Update existing notification
                $notification->update([
                    'notify_when_status' => $validated['notify_when_status'],
                    'is_active' => true
                ]);
                $message = 'Notification updated';
            } else {
                // Create new notification
                $notification = UserNotification::create([
                    'user_id' => $user->id,
                    'restaurant_id' => $restaurant_id,
                    'notify_when_status' => $validated['notify_when_status'],
                    'is_active' => true
                ]);
                $message = 'Notification set';
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'notification' => [
                    'id' => $notification->id,
                    'restaurant_id' => $notification->restaurant_id,
                    'restaurant_name' => $restaurant->name,
                    'notify_when_status' => $notification->notify_when_status,
                    'status_text' => $this->getStatusText($notification->notify_when_status)
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Set notification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to set notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get user's notification preferences
     */
    public function getNotifications()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'User not authenticated'], 401);
            }
            
            $notifications = UserNotification::with(['restaurant' => function($query) {
                $query->select('id', 'name', 'cuisine_type', 'address');
            }])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->get()
            ->map(function($notification) {
                return [
                    'id' => $notification->id,
                    'restaurant_id' => $notification->restaurant_id,
                    'restaurant_name' => $notification->restaurant->name,
                    'cuisine' => $notification->restaurant->cuisine_type,
                    'address' => $notification->restaurant->address,
                    'notify_when_status' => $notification->notify_when_status,
                    'status_text' => $this->getStatusText($notification->notify_when_status),
                    'created_at' => $notification->created_at
                ];
            });
            
            return response()->json([
                'success' => true,
                'notifications' => $notifications,
                'count' => $notifications->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get notifications error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Remove a notification
     */
    public function removeNotification($notification_id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'User not authenticated'], 401);
            }
            
            $notification = UserNotification::where('id', $notification_id)
                ->where('user_id', $user->id)
                ->first();
            
            if (!$notification) {
                return response()->json(['message' => 'Notification not found'], 404);
            }
            
            // Soft delete by setting inactive
            $notification->update(['is_active' => false]);
            
            return response()->json([
                'success' => true,
                'message' => 'Notification removed'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Remove notification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Convert status code to readable text
     */
    private function getStatusText($status)
    {
        switch ($status) {
            case 'green': return 'Low Crowd';
            case 'yellow': return 'Moderate Crowd';
            case 'orange': return 'Busy';
            case 'red': return 'Very High Crowd';
            default: return 'Unknown';
        }
    }
}
