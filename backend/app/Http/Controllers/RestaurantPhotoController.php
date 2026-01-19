<?php

namespace App\Http\Controllers;

use App\Models\RestaurantPhoto;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RestaurantPhotoController extends Controller
{
    // Get all photos for a restaurant
    public function index($restaurantId)
    {
        $restaurant = Restaurant::findOrFail($restaurantId);

        // Check if user owns the restaurant or is admin
        $user = Auth::user();
        if ($user->id !== $restaurant->owner_id && $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // FIXED: Simple order by created_at, no ordered() scope
        $photos = RestaurantPhoto::where('restaurant_id', $restaurantId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($photos);
    }

    // Upload new photos
    public function store(Request $request, $restaurantId)
    {

        Log::info('=== PHOTO UPLOAD START ===');
        Log::info('Restaurant ID: ' . $restaurantId);
        Log::info('User ID: ' . Auth::id());
        Log::info('Request has files: ' . ($request->hasFile('photos') ? 'YES' : 'NO'));

        if ($request->hasFile('photos')) {
            $files = $request->file('photos');
            Log::info('Files count: ' . count($files));
            foreach ($files as $index => $file) {
                Log::info("File {$index}: " . $file->getClientOriginalName() .
                    ' | Size: ' . $file->getSize() .
                    ' | Type: ' . $file->getMimeType());
            }
        }
        $restaurant = Restaurant::findOrFail($restaurantId);

        // Check if user owns the restaurant or is admin
        $user = Auth::user();
        if ($user->id !== $restaurant->owner_id && $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $request->validate([
            'photos' => 'required|array|min:1|max:10',
            'photos.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB per image
            'captions' => 'nullable|array',
            'captions.*' => 'nullable|string|max:255'
        ]);

        $uploadedPhotos = [];

        foreach ($request->file('photos') as $index => $photo) {
            try {
                // Create directory if it doesn't exist
                $directory = "restaurant-gallery/{$restaurantId}";
                if (!Storage::disk('public')->exists($directory)) {
                    Storage::disk('public')->makeDirectory($directory);
                }

                // Generate unique filename
                $filename = uniqid() . '_' . time() . '_' . ($index + 1) . '.' . $photo->getClientOriginalExtension();
                $path = $photo->storeAs($directory, $filename, 'public');

                // Get caption if provided
                $caption = $request->input("captions.{$index}", null);

                // Create photo record - FIXED
                $restaurantPhoto = RestaurantPhoto::create([
                    'restaurant_id' => $restaurantId,
                    'image_url' => $path, // ✅ Changed to image_url
                    'caption' => $caption,
                    'is_primary' => false,
                    'uploaded_by' => $user->id,
                    // ❌ REMOVED: 'display_order' => RestaurantPhoto::where('restaurant_id', $restaurantId)->count()
                ]);

                $uploadedPhotos[] = $restaurantPhoto;
            } catch (\Exception $e) {
                Log::error('Photo upload error: ' . $e->getMessage());
                continue;
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($uploadedPhotos) . ' photos uploaded successfully',
            'photos' => $uploadedPhotos
        ]);

        Log::info('Uploaded photos count: ' . count($uploadedPhotos));
        Log::info('=== PHOTO UPLOAD END ===');

        return response()->json([
            'success' => true,
            'message' => count($uploadedPhotos) . ' photos uploaded successfully',
            'photos' => $uploadedPhotos,
            'debug' => [ // Add debug info
                'files_received' => $request->hasFile('photos') ? count($request->file('photos')) : 0,
                'directory' => "restaurant-gallery/{$restaurantId}",
                'storage_disk' => 'public'
            ]
        ]);
    }

    // Set a photo as primary
    public function setPrimary($restaurantId, $photoId)
    {
        $restaurant = Restaurant::findOrFail($restaurantId);

        // Check if user owns the restaurant or is admin
        $user = Auth::user();
        if ($user->id !== $restaurant->owner_id && $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // First, unset any existing primary photo
        RestaurantPhoto::where('restaurant_id', $restaurantId)
            ->where('is_primary', true)
            ->update(['is_primary' => false]);

        // Set the new primary photo
        $photo = RestaurantPhoto::where('restaurant_id', $restaurantId)
            ->where('id', $photoId)
            ->firstOrFail();

        $photo->is_primary = true;
        $photo->save();

        return response()->json([
            'success' => true,
            'message' => 'Photo set as primary successfully',
            'photo' => $photo
        ]);
    }

    // Delete a photo
    public function destroy($restaurantId, $photoId)
    {
        $restaurant = Restaurant::findOrFail($restaurantId);

        // Check if user owns the restaurant or is admin
        $user = Auth::user();
        if ($user->id !== $restaurant->owner_id && $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $photo = RestaurantPhoto::where('restaurant_id', $restaurantId)
            ->where('id', $photoId)
            ->firstOrFail();

        // Delete file from storage
        if (Storage::disk('public')->exists($photo->image_url)) {
            Storage::disk('public')->delete($photo->image_url);
        }

        // Delete record
        $photo->delete();

        // If this was primary, set another photo as primary if available
        if ($photo->is_primary) {
            $newPrimary = RestaurantPhoto::where('restaurant_id', $restaurantId)
                ->first();

            if ($newPrimary) {
                $newPrimary->is_primary = true;
                $newPrimary->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Photo deleted successfully'
        ]);
    }

    // Update photo caption or order
    public function update(Request $request, $restaurantId, $photoId)
    {
        $restaurant = Restaurant::findOrFail($restaurantId);

        // Check if user owns the restaurant or is admin
        $user = Auth::user();
        if ($user->id !== $restaurant->owner_id && $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $request->validate([
            'caption' => 'nullable|string|max:255',
            'display_order' => 'nullable|integer'
        ]);

        $photo = RestaurantPhoto::where('restaurant_id', $restaurantId)
            ->where('id', $photoId)
            ->firstOrFail();

        if ($request->has('caption')) {
            $photo->caption = $request->input('caption');
        }

        if ($request->has('display_order')) {
            $photo->display_order = $request->input('display_order');
        }

        $photo->save();

        return response()->json([
            'success' => true,
            'message' => 'Photo updated successfully',
            'photo' => $photo
        ]);
    }
}
