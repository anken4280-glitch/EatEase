<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    // Get all restaurants for admin
    public function getAllRestaurants()
    {
        try {
            $restaurants = Restaurant::with(['owner' => function ($query) {
                $query->select('id', 'name', 'email');
            }])->get();

            $formattedRestaurants = $restaurants->map(function ($restaurant) {
                return [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'owner_id' => $restaurant->owner_id,
                    'owner_name' => $restaurant->owner->name ?? 'Unknown',
                    'cuisine_type' => $restaurant->cuisine_type,
                    'address' => $restaurant->address,
                    'phone' => $restaurant->phone,
                    'current_occupancy' => $restaurant->current_occupancy,
                    'max_capacity' => $restaurant->max_capacity,
                    'crowd_status' => $restaurant->crowd_status,
                    'is_verified' => $restaurant->is_verified ?? false,
                    'is_suspended' => $restaurant->is_suspended ?? false,
                    'is_featured' => $restaurant->is_featured ?? false,
                    'created_at' => $restaurant->created_at,
                    'updated_at' => $restaurant->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'restaurants' => $formattedRestaurants,
                'count' => $formattedRestaurants->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Admin get restaurants error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch restaurants'
            ], 500);
        }
    }

    // Get all users for admin
    public function getAllUsers()
    {
        try {
            $users = User::all()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                    'is_admin' => $user->is_admin ?? false,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'users' => $users,
                'count' => $users->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Admin get users error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users'
            ], 500);
        }
    }

    // Verify a restaurant
    public function verifyRestaurant($id)
    {
        try {
            $restaurant = Restaurant::find($id);

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant not found'
                ], 404);
            }

            $restaurant->update([
                'is_verified' => true,
                'verified_at' => now(),
                'verified_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Restaurant verified successfully',
                'restaurant' => $restaurant
            ]);
        } catch (\Exception $e) {
            Log::error('Verify restaurant error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify restaurant'
            ], 500);
        }
    }

    // Suspend a restaurant
    public function suspendRestaurant(Request $request, $id)
    {
        try {
            $restaurant = Restaurant::find($id);

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant not found'
                ], 404);
            }

            $suspended = !$restaurant->is_suspended; // Toggle
            $reason = $request->input('reason', '');

            $restaurant->update([
                'is_suspended' => $suspended,
                'suspended_reason' => $suspended ? $reason : null,
                'suspended_at' => $suspended ? now() : null
            ]);

            $action = $suspended ? 'suspended' : 'unsuspended';

            return response()->json([
                'success' => true,
                'message' => "Restaurant {$action} successfully",
                'restaurant' => $restaurant
            ]);
        } catch (\Exception $e) {
            Log::error('Suspend restaurant error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update restaurant status'
            ], 500);
        }
    }

    // Get all pending verification requests
    public function getVerificationRequests()
    {
        try {
            $requests = Restaurant::where('verification_status', 'pending')
                ->with(['owner' => function ($query) {
                    $query->select('id', 'name', 'email');
                }])
                ->orderBy('verification_requested_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'requests' => $requests,
                'count' => $requests->count()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error()('Get verification requests error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch verification requests'
            ], 500);
        }
    }

    // Approve verification
    public function approveVerification($id)
    {
        try {
            $restaurant = Restaurant::find($id);

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant not found'
                ], 404);
            }

            $restaurant->update([
                'verification_status' => 'approved',
                'is_verified' => true,
                'verified_at' => now(),
                'verified_by' => Auth::id(),
                'verification_processed_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Restaurant verification approved',
                'restaurant' => $restaurant
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error()('Approve verification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve verification'
            ], 500);
        }
    }

    // Reject verification
    // In AdminController.php
public function rejectVerification(Request $request, $id)
{
    try {
        $user = Auth::user();
        
        $restaurant = Restaurant::find($id);
        
        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found'
            ], 404);
        }
        
        // Get reason from request or use default
        $reason = $request->input('rejection_reason', 'Verification request rejected by admin.');
        
        // Update restaurant - reset verification request
        $restaurant->update([
            'verification_requested' => false,
            'is_verified' => false,
            'suspended_reason' => $reason,
            'verification_requested_at' => null,
            'admin_notes' => $restaurant->admin_notes . ' [REJECTED: ' . $reason . ']'
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Verification request rejected successfully',
            'restaurant' => $restaurant
        ]);
        
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Reject verification error: ' . $e->getMessage());
        \Illuminate\Support\Facades\Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
}
}
