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
        $validator = Validator::make($request->all(), [
            'restaurant_id' => 'required|exists:restaurants,id',
            'party_size' => 'required|integer|min:1|max:10',
            'hold_type' => 'required|in:quick_10min,extended_20min',
            'special_requests' => 'nullable|string|max:200',
            'notification_id' => 'nullable|exists:notifications,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $data = $validator->validated();

        // Check if user already has an active hold at this restaurant
        $existingHold = Reservation::where('user_id', $user->id)
            ->where('restaurant_id', $data['restaurant_id'])
            ->where('hold_status', 'accepted')
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

        // Create hold
        $hold = new Reservation([
            'user_id' => $user->id,
            'restaurant_id' => $data['restaurant_id'],
            'party_size' => $data['party_size'],
            'hold_type' => $data['hold_type'],
            'expires_at' => $expiresAt,
            'hold_status' => 'pending', // Restaurant needs to accept
            'special_requests' => $data['special_requests'] ?? null,
            'status' => 'pending_hold', // Using existing status field
            'confirmation_code' => strtoupper(substr(md5(uniqid()), 0, 8))
        ]);

        $hold->save();

        // TODO: Notify restaurant (push notification or dashboard alert)

        return response()->json([
            'success' => true,
            'message' => 'Spot hold created successfully',
            'hold' => $hold->load('restaurant'),
            'confirmation_code' => $hold->confirmation_code,
            'expires_at' => $expiresAt->toDateTimeString()
        ], 201);
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
}
