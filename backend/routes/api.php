<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RestaurantController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\RestaurantPhotoController;
use App\Http\Controllers\ReservationController;

// DELETE
Route::get('/test-spot-holds-public', function() {
    return response()->json([
        'success' => true,
        'message' => 'Public test route works',
        'routes_exist' => [
            '/my-restaurant/spot-holds' => Route::has('my-restaurant.spot-holds'),
            '/restaurant/my' => true,
        ]
    ]);
});

// Delete too
// In api.php - temporary test
Route::get('/test-remove-route', function() {
    return response()->json([
        'routes' => [
            'DELETE /api/reservations/{id}/remove' => 'Exists',
            'test' => 'Working'
        ]
    ]);
});

// DEBUG ROUTES - Add these at the VERY TOP
Route::get('/debug-public', function() {
    return response()->json([
        'message' => '✅ Public route works',
        'routes_loaded' => true
    ]);
});

Route::middleware('auth:sanctum')->get('/debug-protected', function() {
    $user = auth()->user();
    return response()->json([
        'message' => '✅ Protected route works',
        'user' => $user ? ['id' => $user->id, 'email' => $user->email] : null,
        'auth_working' => !is_null($user)
    ]);
});

Route::middleware('auth:sanctum')->get('/debug-reservations-test', [ReservationController::class, 'index']);

//Reservation Availability check
Route::get('/restaurants/{restaurant}/availability', [ReservationController::class, 'checkAvailability']);

Route::get('/test-db', function () {
    try {
        $databaseName = DB::connection()->getDatabaseName();
        return response()->json([
            'status' => 'success',
            'message' => 'Database connected successfully!',
            'database' => $databaseName
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Database connection failed',
            'error' => $e->getMessage()
        ]);
    }
});

Route::get('/test-api', function () {
    return response()->json([
        'message' => '✅ API is working!',
        'timestamp' => now()
    ]);
});

// Authentication routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/signup', [AuthController::class, 'signup']);

// Public restaurant routes
Route::get('/restaurants', [RestaurantController::class, 'getAllRestaurants']);
Route::get('/restaurants/{id}', [RestaurantController::class, 'getRestaurantById']);
Route::get('/restaurants/{id}/menu', [RestaurantController::class, 'getMenuItems']);
Route::get('/restaurants/{id}/photos', [RestaurantController::class, 'getPhotos']);
Route::get('/restaurants/{id}/stats', [RestaurantController::class, 'getRestaurantStats']);
Route::get('/restaurants/{id}/reviews', [ReviewController::class, 'index']);
Route::get('/restaurants/{id}/menu-text', [MenuController::class, 'show']);
Route::get('/restaurants/premium/recommendations', [RecommendationController::class, 'getPremiumRecommendations']);
Route::get('/restaurants/{id}/menu', [MenuController::class, 'show']);

// ==================== PROTECTED ROUTES ====================
Route::middleware('auth:sanctum')->group(function () {
    // Restaurant management routes
    Route::get('/restaurant/my', [RestaurantController::class, 'getMyRestaurant']);
    Route::post('/restaurant/save', [RestaurantController::class, 'saveRestaurant']);
    Route::put('/restaurant/occupancy', [RestaurantController::class, 'updateOccupancy']);
    Route::post('/restaurant/request-verification', [RestaurantController::class, 'requestVerification']);
    Route::post('/restaurant/request-feature', [RestaurantController::class, 'requestFeature']);
    
    // Restaurant owner only routes
    Route::middleware('business.only')->group(function () {
        Route::post('/restaurant/upload/{type}', [RestaurantController::class, 'uploadImage']);
        Route::post('/restaurant/banner-position', [RestaurantController::class, 'updateBannerPosition']);
        
        Route::prefix('restaurant/{restaurant}/photos')->group(function () {
            Route::get('/', [RestaurantPhotoController::class, 'index']);
            Route::post('/', [RestaurantPhotoController::class, 'store']);
            Route::put('/{photo}/primary', [RestaurantPhotoController::class, 'setPrimary']);
            Route::put('/{photo}', [RestaurantPhotoController::class, 'update']);
            Route::delete('/{photo}', [RestaurantPhotoController::class, 'destroy']);
        });
        
        Route::put('/restaurants/{id}/menu-text', [MenuController::class, 'update']);
        Route::get('/restaurants/{id}/analytics', [AnalyticsController::class, 'getRestaurantAnalytics']);
    });
    
    // ========== RESERVATION ROUTES ==========
    // User reservation routes
    Route::prefix('reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'index']);
        Route::post('/', [ReservationController::class, 'store']);
        Route::get('/{id}', [ReservationController::class, 'show']);
        Route::delete('/{id}', [ReservationController::class, 'destroy']);
        Route::post('/hold-spot', [ReservationController::class, 'holdSpot']);
        Route::delete('/{id}/remove', [ReservationController::class, 'removeFromView']);
    });
    
    // ========== RESTAURANT OWNER RESERVATION MANAGEMENT ==========
    Route::prefix('my-restaurant')->group(function () {
        Route::get('/spot-holds', [ReservationController::class, 'getRestaurantSpotHolds']);
        Route::get('/spot-holds/expired', [ReservationController::class, 'getExpiredSpotHolds']);
        Route::put('/spot-holds/{id}/accept', [ReservationController::class, 'acceptSpotHold']);
        Route::put('/spot-holds/{id}/reject', [ReservationController::class, 'rejectSpotHold']);
        Route::get('/todays-reservations', [ReservationController::class, 'getTodaysReservations']);
        Route::get('/capacity-status', [ReservationController::class, 'getCapacityStatus']);
    });
    
    Route::get('/restaurants/{id}/capacity', [ReservationController::class, 'getCapacityStatus']);
    
    // ========== NOTIFICATION & BOOKMARK ROUTES ==========
    Route::post('/bookmarks/{restaurant_id}', [NotificationController::class, 'toggleBookmark']);
    Route::get('/bookmarks', [NotificationController::class, 'getBookmarks']);
    Route::delete('/bookmarks/cleanup', [NotificationController::class, 'cleanupOrphanedBookmarks']);
    
    Route::post('/notifications/{restaurant_id}', [NotificationController::class, 'setNotification']);
    Route::get('/notifications', [NotificationController::class, 'getNotifications']);
    Route::delete('/notifications/{notification_id}', [NotificationController::class, 'removeNotification']);
    Route::put('/notifications/{notification_id}/mark-read', [NotificationController::class, 'markAsRead']);
    
    Route::get('/user-notifications', [NotificationController::class, 'getUserNotifications']);
    Route::delete('/user-notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/user-notifications', [NotificationController::class, 'destroyAll']);
    
    // ========== REVIEW ROUTES ==========
    Route::post('/restaurants/{id}/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'updateReview']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'deleteReview']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
    
    // ========== SUBSCRIPTION ROUTES ==========
    Route::get('/subscription/tier', [SubscriptionController::class, 'getCurrentTier']);
    Route::post('/subscription/upgrade', [SubscriptionController::class, 'upgradeToPremium']);
    Route::get('/subscription/can-apply-featured', [SubscriptionController::class, 'canApplyForFeatured']);
    
    // ========== DEBUG ROUTES ==========
    Route::post('/debug-save', function (Request $request) {
        try {
            $user = Auth::user();
            if (!$user) return response()->json(['error' => 'Not authenticated'], 401);
            
            $receivedValue = $request->input('current_occupancy');
            $restaurant = \App\Models\Restaurant::create([
                'owner_id' => $user->id,
                'name' => 'Debug Test ' . time(),
                'cuisine_type' => 'Debug',
                'address' => 'Debug',
                'phone' => '123',
                'hours' => '9-5',
                'max_capacity' => 100,
                'current_occupancy' => 88,
            ]);
            
            return response()->json([
                'success' => true,
                'debug_info' => [
                    'received_current_occupancy' => $receivedValue,
                    'type_of_received' => gettype($receivedValue),
                    'hardcoded_saved_value' => 88,
                    'actual_saved_value' => $restaurant->current_occupancy,
                    'all_attributes' => $restaurant->getAttributes()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    });
    
    Route::post('/debug-simple', function (Request $request) {
        $receivedValue = $request->input('current_occupancy');
        return response()->json([
            'success' => true,
            'received_current_occupancy' => $receivedValue,
            'type_of_value' => gettype($receivedValue),
            'all_request_data' => $request->all(),
            'raw_post_data' => file_get_contents('php://input'),
            'server_time' => now()
        ]);
    });
    
    Route::get('/debug/restaurant-owner', function() {
        $user = Auth::user();
        return response()->json([
            'user_id' => $user->id,
            'user_type' => $user->user_type,
            'email' => $user->email,
            'restaurant' => \App\Models\Restaurant::where('owner_id', $user->id)->first(),
            'has_restaurant' => \App\Models\Restaurant::where('owner_id', $user->id)->exists(),
            'total_reservations' => \App\Models\Reservation::count(),
            'pending_holds_for_restaurant_14' => \App\Models\Reservation::where('restaurant_id', 14)
                ->where('status', 'pending_hold')
                ->count()
        ]);
    });
});

// ========== ADMIN ROUTES ==========
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/restaurants', [AdminController::class, 'getAllRestaurants']);
    Route::post('/suspend-restaurant/{id}', [AdminController::class, 'suspendRestaurant']);
    Route::get('/users', [AdminController::class, 'getAllUsers']);
    Route::get('/verification-requests', [AdminController::class, 'getVerificationRequests']);
    Route::post('/verify-restaurant/{id}', [AdminController::class, 'verifyRestaurant']);
    Route::post('/reject-verification/{id}', [AdminController::class, 'rejectVerification']);
    Route::get('/feature-requests', [AdminController::class, 'getFeatureRequests']);
    Route::post('/approve-feature-request/{id}', [AdminController::class, 'approveFeatureRequest']);
    Route::post('/reject-feature-request/{id}', [AdminController::class, 'rejectFeatureRequest']);
});