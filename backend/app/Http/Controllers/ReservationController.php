<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ReservationController extends Controller
{
    /**
     * Display a listing of the user's reservations.
     */
    public function index()
    {
        try {
            $reservations = Reservation::with(['restaurant' => function ($query) {
                $query->select('id', 'name', 'address', 'phone', 'profile_image');
            }])
                ->where('user_id', Auth::id())
                ->orderBy('reservation_date', 'desc')
                ->orderBy('reservation_time', 'desc')
                ->paginate(10);

            return response()->json([
                'success' => true,
                'reservations' => $reservations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reservations'
            ], 500);
        }
    }

    /**
     * Store a newly created reservation.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id' => 'required|exists:restaurants,id',
            'party_size' => 'required|integer|min:1|max:30',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|date_format:H:i',
            'special_requests' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $restaurant = Restaurant::findOrFail($request->restaurant_id);

            // Check if restaurant is open (basic check)
            $currentTime = now();
            $reservationDateTime = $request->reservation_date . ' ' . $request->reservation_time;

            if (
                strtotime($reservationDateTime) < strtotime('today 17:00') ||
                strtotime($reservationDateTime) > strtotime('today 22:00')
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant is only open from 5:00 PM to 10:00 PM'
                ], 422);
            }

            // Check capacity
            $existingReservations = Reservation::where('restaurant_id', $restaurant->id)
                ->where('reservation_date', $request->reservation_date)
                ->where('reservation_time', $request->reservation_time)
                ->whereIn('status', ['pending', 'confirmed'])
                ->sum('party_size');

            $totalOccupancy = $existingReservations + $request->party_size;

            if ($totalOccupancy > $restaurant->max_capacity) {
                return response()->json([
                    'success' => false,
                    'message' => 'No available tables for your party size at this time. Please try another time.',
                    'available_capacity' => $restaurant->max_capacity - $existingReservations
                ], 422);
            }

            $reservation = Reservation::create([
                'user_id' => Auth::id(),
                'restaurant_id' => $request->restaurant_id,
                'party_size' => $request->party_size,
                'reservation_date' => $request->reservation_date,
                'reservation_time' => $request->reservation_time,
                'special_requests' => $request->special_requests,
                'status' => 'confirmed',
                'confirmation_code' => Reservation::generateConfirmationCode()
            ]);

            // Update restaurant current occupancy (optional)
            $restaurant->current_occupancy = min(
                $restaurant->current_occupancy + $request->party_size,
                $restaurant->max_capacity
            );
            $restaurant->save();

            // Load relationship for response
            $reservation->load('restaurant');

            return response()->json([
                'success' => true,
                'message' => 'Reservation created successfully!',
                'reservation' => $reservation,
                'confirmation_code' => $reservation->confirmation_code
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified reservation.
     */
    public function show($id)
    {
        try {
            $reservation = Reservation::with('restaurant')
                ->where('user_id', Auth::id())
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'reservation' => $reservation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Reservation not found'
            ], 404);
        }
    }

    public function holdSpot(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'restaurant_id' => 'required|exists:restaurants,id',
                'party_size' => 'required|integer|min:1|max:10',
                'hold_type' => 'required|in:quick_10min,extended_20min',
                'special_requests' => 'nullable|string|max:200',
                'notification_id' => 'nullable|exists:notification_logs,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            // Check if user already has an active hold at this restaurant
            $existingHold = Reservation::where('user_id', $user->id)
                ->where('restaurant_id', $data['restaurant_id'])
                ->where('hold_status', 'pending')
                ->where('expires_at', '>', now())
                ->first();

            if ($existingHold) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active hold at this restaurant'
                ], 400);
            }

            // Calculate expiry time
            $expiryMinutes = $data['hold_type'] === 'quick_10min' ? 10 : 20;
            $expiresAt = now()->addMinutes($expiryMinutes);

            // Create hold - ALL REQUIRED FIELDS
            $hold = new Reservation([
                'user_id' => $user->id,
                'restaurant_id' => $data['restaurant_id'],
                'party_size' => $data['party_size'],
                'hold_type' => $data['hold_type'],
                'expires_at' => $expiresAt,
                'hold_status' => 'pending',

                // REQUIRED: reservation_date and reservation_time
                'reservation_date' => now()->format('Y-m-d'), // Current date
                'reservation_time' => now()->format('H:i:s'), // Current time

                'special_requests' => $data['special_requests'] ?? null,
                'status' => 'pending_hold', // Use the new status
                'confirmation_code' => strtoupper(substr(md5(uniqid()), 0, 8)),

                // Default values for other columns
                'notification_count' => 0,
                'last_notified_at' => null
            ]);

            $hold->save();

            return response()->json([
                'success' => true,
                'message' => 'Spot hold created successfully',
                'hold' => $hold->load('restaurant'),
                'confirmation_code' => $hold->confirmation_code,
                'expires_at' => $expiresAt->toDateTimeString(),
                'expires_in' => $expiryMinutes . ' minutes'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Hold spot error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create spot hold',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
    /**
     * Cancel the specified reservation.
     */
    public function destroy($id)
    {
        try {
            $reservation = Reservation::where('user_id', Auth::id())->findOrFail($id);

            if (!$reservation->canBeCancelled()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reservations can only be cancelled at least 2 hours in advance.'
                ], 422);
            }

            $reservation->status = 'cancelled';
            $reservation->save();

            // Update restaurant occupancy (optional)
            $restaurant = $reservation->restaurant;
            $restaurant->current_occupancy = max(
                $restaurant->current_occupancy - $reservation->party_size,
                0
            );
            $restaurant->save();

            return response()->json([
                'success' => true,
                'message' => 'Reservation cancelled successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel reservation'
            ], 500);
        }
    }

    /**
     * Check availability for a restaurant.
     */
    public function checkAvailability(Request $request, $restaurantId)
    {
        Log::info('🔍 checkAvailability called', [
            'restaurantId' => $restaurantId,
            'date' => $request->date,
            'party_size' => $request->party_size,
            'fullUrl' => $request->fullUrl()
        ]);

        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date|after_or_equal:today',
                'party_size' => 'required|integer|min:1|max:30'
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $restaurant = Restaurant::findOrFail($restaurantId);

            Log::info('Restaurant found', [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'max_capacity' => $restaurant->max_capacity
            ]);

            // Generate time slots (5 PM to 10 PM, every 30 minutes)
            $timeSlots = [];
            $startTime = '17:00';
            $endTime = '22:00';

            $current = strtotime($startTime);
            $end = strtotime($endTime);

            while ($current <= $end) {
                $time = date('H:i', $current);

                // Check capacity for this time slot
                $existingReservations = Reservation::where('restaurant_id', $restaurantId)
                    ->where('reservation_date', $request->date)
                    ->where('reservation_time', $time)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->sum('party_size');

                $availableCapacity = $restaurant->max_capacity - $existingReservations;
                $isAvailable = $availableCapacity >= $request->party_size;

                $timeSlots[] = [
                    'time' => $time,
                    'available' => $isAvailable,
                    'available_capacity' => $availableCapacity,
                    'formatted_time' => date('g:i A', $current)
                ];

                $current = strtotime('+30 minutes', $current);
            }

            Log::info('Availability calculated', [
                'time_slots_count' => count($timeSlots),
                'has_availability' => collect($timeSlots)->where('available', true)->count() > 0
            ]);

            return response()->json([
                'success' => true,
                'restaurant' => [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'max_capacity' => $restaurant->max_capacity
                ],
                'date' => $request->date,
                'party_size' => $request->party_size,
                'time_slots' => $timeSlots,
                'has_availability' => collect($timeSlots)->where('available', true)->count() > 0
            ]);
        } catch (\Exception $e) {
            Log::error('checkAvailability failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check availability: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getRestaurantSpotHolds(Request $request)
    {
        // Use Log facade (without backslash)
        Log::info('========== getRestaurantSpotHolds CALLED ==========');

        try {
            // Check authentication
            if (!Auth::check()) {
                Log::error('User not authenticated');
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            $user = Auth::user();
            Log::info('User info', [
                'id' => $user->id,
                'email' => $user->email,
                'user_type' => $user->user_type
            ]);

            // Check if user is a restaurant owner
            if ($user->user_type !== 'restaurant_owner') {
                Log::warning('User is not restaurant owner', [
                    'actual_type' => $user->user_type,
                    'required_type' => 'restaurant_owner'
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Restaurant owners only.',
                    'user_type' => $user->user_type
                ], 403);
            }

            // Get the restaurant owned by this user
            Log::info('Looking for restaurant with owner_id', ['owner_id' => $user->id]);
            $restaurant = Restaurant::where('owner_id', $user->id)->first();

            if (!$restaurant) {
                Log::warning('No restaurant found for user', [
                    'user_id' => $user->id,
                    'user_email' => $user->email
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'No restaurant found for this user.',
                    'user_id' => $user->id
                ], 404);
            }

            Log::info('Restaurant found', [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'owner_id' => $restaurant->owner_id
            ]);

            // Get active spot holds
            $query = Reservation::with(['user' => function ($q) {
                $q->select('id', 'name', 'email', 'phone');
            }])
                ->where('restaurant_id', $restaurant->id)
                ->where('status', 'pending_hold');

            // Filter by expiration
            $query->where(function ($q) {
                $q->where('expires_at', '>', now())
                    ->orWhereNull('expires_at');
            });

            // Filter by hold type if specified
            if ($request->has('hold_type')) {
                $query->where('hold_type', $request->hold_type);
            }

            // Order by expiration (soonest first)
            $reservations = $query->orderBy('expires_at', 'asc')->get();

            Log::info('Found reservations', [
                'count' => $reservations->count(),
                'restaurant_id' => $restaurant->id
            ]);

            // Calculate time remaining for each hold
            $reservations->each(function ($reservation) {
                if ($reservation->expires_at) {
                    $reservation->time_remaining = now()->diffInMinutes($reservation->expires_at, false);
                    $reservation->is_expired = $reservation->time_remaining <= 0;
                } else {
                    $reservation->time_remaining = null;
                    $reservation->is_expired = false;
                }
            });

            Log::info('========== REQUEST COMPLETED SUCCESSFULLY ==========');

            return response()->json([
                'success' => true,
                'restaurant' => [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'max_capacity' => $restaurant->max_capacity,
                    'current_occupancy' => $restaurant->current_occupancy
                ],
                'spot_holds' => $reservations,
                'counts' => [
                    'active_holds' => $reservations->count(),
                    'expired_holds' => Reservation::where('restaurant_id', $restaurant->id)
                        ->where('status', 'pending_hold')
                        ->where('expires_at', '<=', now())
                        ->count(),
                    'total_confirmed' => Reservation::where('restaurant_id', $restaurant->id)
                        ->where('status', 'confirmed')
                        ->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getRestaurantSpotHolds: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Accept a spot hold (convert to confirmed reservation)
     */
    public function acceptSpotHold($id)
    {
        try {
            $user = Auth::user();
            $restaurant = Restaurant::where('owner_id', $user->id)->first();

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'No restaurant found'
                ], 404);
            }

            $hold = Reservation::where('id', $id)
                ->where('restaurant_id', $restaurant->id)
                ->where('status', 'pending_hold')
                ->where('expires_at', '>', now()) // Only accept if not expired
                ->firstOrFail();

            // Check restaurant capacity
            $currentOccupancy = $restaurant->current_occupancy;
            $availableCapacity = $restaurant->max_capacity - $currentOccupancy;

            if ($availableCapacity < $hold->party_size) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not enough capacity to accept this hold. Available: ' . $availableCapacity
                ], 422);
            }

            // Convert hold to confirmed reservation
            $hold->status = 'confirmed';
            $hold->hold_status = 'accepted';
            $hold->expires_at = null; // Remove expiration since it's now confirmed
            $hold->save();

            // Update restaurant occupancy
            $restaurant->current_occupancy = $currentOccupancy + $hold->party_size;
            $restaurant->save();

            // Create notification for diner
            $this->createHoldNotification($hold, 'accepted');

            return response()->json([
                'success' => true,
                'message' => 'Spot hold accepted! Reservation confirmed.',
                'reservation' => $hold->load('user'),
                'restaurant_occupancy' => [
                    'current' => $restaurant->current_occupancy,
                    'max' => $restaurant->max_capacity,
                    'available' => $restaurant->max_capacity - $restaurant->current_occupancy
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept spot hold: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a spot hold
     */
    public function rejectSpotHold($id)
    {
        try {
            $user = Auth::user();
            $restaurant = Restaurant::where('owner_id', $user->id)->first();

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'No restaurant found'
                ], 404);
            }

            $hold = Reservation::where('id', $id)
                ->where('restaurant_id', $restaurant->id)
                ->where('status', 'pending_hold')
                ->first();

            if (!$hold) {
                return response()->json([
                    'success' => false,
                    'message' => 'Spot hold not found or already processed'
                ], 404);
            }

            // Reject the hold
            $hold->status = 'cancelled';
            $hold->hold_status = 'rejected';
            $hold->save();

            // Create notification for diner
            $this->createHoldNotification($hold, 'rejected');

            return response()->json([
                'success' => true,
                'message' => 'Spot hold rejected.',
                'reservation' => $hold
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject spot hold: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's confirmed reservations (from accepted holds)
     */
    public function getTodaysReservations()
    {
        try {
            $user = Auth::user();
            $restaurant = Restaurant::where('owner_id', $user->id)->first();

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'No restaurant found'
                ], 404);
            }

            $today = now()->toDateString();

            $reservations = Reservation::with(['user' => function ($q) {
                $q->select('id', 'name', 'email', 'phone');
            }])
                ->where('restaurant_id', $restaurant->id)
                ->where('status', 'confirmed')
                ->where('reservation_date', $today)
                ->orderBy('reservation_time')
                ->get();

            return response()->json([
                'success' => true,
                'date' => $today,
                'reservations' => $reservations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch today\'s reservations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expired spot holds (for cleanup/reporting)
     */
    public function getExpiredSpotHolds()
    {
        try {
            $user = Auth::user();
            $restaurant = Restaurant::where('owner_id', $user->id)->first();

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'No restaurant found'
                ], 404);
            }

            $expiredHolds = Reservation::with(['user'])
                ->where('restaurant_id', $restaurant->id)
                ->where('status', 'pending_hold')
                ->where('expires_at', '<=', now())
                ->orderBy('expires_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json([
                'success' => true,
                'expired_holds' => $expiredHolds
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch expired holds: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Create notification for diner about hold status
     */
    private function createHoldNotification($reservation, $action)
    {
        try {
            // You'll need to implement this based on your notification system
            $message = '';
            $notificationType = '';

            if ($action === 'accepted') {
                $message = "Your spot hold at {$reservation->restaurant->name} has been accepted! Your table for {$reservation->party_size} is confirmed.";
                $notificationType = 'hold_accepted';
            } else {
                $message = "Your spot hold at {$reservation->restaurant->name} was not accepted. Please try another restaurant.";
                $notificationType = 'hold_rejected';
            }

            // Create notification in your notification_logs table
            \App\Models\NotificationLog::create([
                'user_id' => $reservation->user_id,
                'type' => $notificationType,
                'title' => 'Spot Hold Update',
                'message' => $message,
                'related_id' => $reservation->id,
                'related_type' => 'App\Models\Reservation',
                'is_read' => false,
                'metadata' => json_encode([
                    'reservation_id' => $reservation->id,
                    'restaurant_name' => $reservation->restaurant->name,
                    'party_size' => $reservation->party_size,
                    'confirmation_code' => $reservation->confirmation_code
                ])
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            Log::error('Failed to create hold notification: ' . $e->getMessage());
        }
    }
}
