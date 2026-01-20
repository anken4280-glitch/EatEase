<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ReservationController extends Controller
{
    /**
     * Display a listing of the user's reservations.
     */
    public function index()
    {
        try {
            $reservations = Reservation::with(['restaurant' => function($query) {
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
            
            if (strtotime($reservationDateTime) < strtotime('today 17:00') || 
                strtotime($reservationDateTime) > strtotime('today 22:00')) {
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
        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after_or_equal:today',
            'party_size' => 'required|integer|min:1|max:30'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $restaurant = Restaurant::findOrFail($restaurantId);
            
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
            return response()->json([
                'success' => false,
                'message' => 'Failed to check availability'
            ], 500);
        }
    }
}