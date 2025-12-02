<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RestaurantController extends Controller
{
    // Get restaurant for current owner
    public function getMyRestaurant()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        $restaurant = Restaurant::where('owner_id', $user->id)->first();

        if (!$restaurant) {
            return response()->json(['message' => 'No restaurant found'], 404);
        }

        return response()->json([
            'restaurant' => $restaurant,
            'crowd_level' => $restaurant->crowd_level
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
}