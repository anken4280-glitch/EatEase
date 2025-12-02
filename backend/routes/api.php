<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RestaurantController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminController;

Route::get('/test-db', function () {
    try {
        // Simple database test - try to get the database name
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

// Simple API test
Route::get('/test-api', function () {
    return response()->json([
        'message' => '✅ API is working!',
        'timestamp' => now()
    ]);
});

// Login route
Route::post('/auth/login', [App\Http\Controllers\AuthController::class, 'login']);
// Sign Up route
Route::post('/auth/signup', [App\Http\Controllers\AuthController::class, 'signup']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Restaurant routes
    Route::get('/restaurant/my', [RestaurantController::class, 'getMyRestaurant']);
    Route::post('/restaurant/save', [RestaurantController::class, 'saveRestaurant']);
    Route::put('/restaurant/occupancy', [RestaurantController::class, 'updateOccupancy']);
});

// for debugging 
Route::post('/debug-save', function (Request $request) {
    try {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        // Get the value directly
        $receivedValue = $request->input('current_occupancy');

        // Create restaurant with hardcoded value first
        $restaurant = \App\Models\Restaurant::create([
            'owner_id' => $user->id,
            'name' => 'Debug Test ' . time(),
            'cuisine_type' => 'Debug',
            'address' => 'Debug',
            'phone' => '123',
            'hours' => '9-5',
            'max_capacity' => 100,
            'current_occupancy' => 88, // Hardcoded to test
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
})->middleware('auth:sanctum');

Route::post('/debug-simple', function (Request $request) {
    // Test what's being received
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

// PUBLIC route for browsing
Route::get('/restaurants', [RestaurantController::class, 'getAllRestaurants']);

// for single restaurant details
Route::get('/restaurants/{id}', [RestaurantController::class, 'getRestaurantById']);

// Notification
Route::middleware('auth:sanctum')->group(function () {
    // Bookmark routes
    Route::post('/bookmarks/{restaurant_id}', [NotificationController::class, 'toggleBookmark']);
    Route::get('/bookmarks', [NotificationController::class, 'getBookmarks']);

    // Notification routes
    Route::post('/notifications/{restaurant_id}', [NotificationController::class, 'setNotification']);
    Route::get('/notifications', [NotificationController::class, 'getNotifications']);
    Route::delete('/notifications/{notification_id}', [NotificationController::class, 'removeNotification']);
});

// Admin routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/restaurants', [AdminController::class, 'getAllRestaurants']);
    Route::get('/users', [AdminController::class, 'getAllUsers']);
    Route::post('/verify-restaurant/{id}', [AdminController::class, 'verifyRestaurant']);
    Route::post('/suspend-restaurant/{id}', [AdminController::class, 'suspendRestaurant']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Verification request (for owners)
    Route::post('/restaurant/request-verification', [RestaurantController::class, 'requestVerification']);

    // Admin verification management
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/verification-requests', [AdminController::class, 'getVerificationRequests']);
        Route::post('/verify-restaurant/{id}', [AdminController::class, 'approveVerification']);
        Route::post('/reject-verification/{id}', [AdminController::class, 'rejectVerification']);
    });
});
