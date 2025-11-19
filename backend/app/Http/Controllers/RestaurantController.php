<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    // GET all restaurants with their status
    public function index()
    {
        $restaurants = Restaurant::with('status')->get();
        return response()->json($restaurants);
    }

    // UPDATE a restaurant's status
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:green,yellow,red'
        ]);

        $restaurant = Restaurant::find($id);
        $restaurant->status()->updateOrCreate(
            [],
            ['status' => $request->status]
        );

        return response()->json(['message' => 'Status updated successfully']);
    }
}