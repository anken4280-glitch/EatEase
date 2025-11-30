<?php
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/test-db', function() {
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
Route::get('/test-api', function() {
    return response()->json([
        'message' => '✅ API is working!',
        'timestamp' => now()
    ]);
});

// Login route
Route::post('/auth/login', [App\Http\Controllers\AuthController::class, 'login']);
// Sign Up route
Route::post('/auth/signup', [App\Http\Controllers\AuthController::class, 'signup']);