<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MenuController extends Controller
{
    // Public: Get menu text
    public function show($restaurantId)
    {
        $restaurant = Restaurant::find($restaurantId);

        return response()->json([
            'success' => true,
            'menu_description' => $restaurant->menu_description,
            'restaurant_name' => $restaurant->name
        ]);
    }

    // Owner only: Update menu text
    public function update(Request $request, $id)
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json(['error' => 'Restaurant not found'], 404);
        }

        // Check if user owns this restaurant
        if (
            auth()->user()->user_type !== 'restaurant_owner' ||
            auth()->id() !== $restaurant->owner_id
        ) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'menu_description' => 'nullable|string'  // Field name should match
        ]);

        $restaurant->menu_description = $request->menu_description;
        $restaurant->save();

        return response()->json([
            'success' => true,
            'message' => 'Menu updated successfully',
            'menu_description' => $restaurant->menu_description
        ]);
    }
}
