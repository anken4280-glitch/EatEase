<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'restaurant_id',
        'party_size',
        'reservation_date',
        'reservation_time',
        'status',
        'special_requests',
        'confirmation_code',
        'notification_count',
        'last_notified_at'
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'last_notified_at' => 'datetime',
        'party_size' => 'integer'
    ];

    /**
     * Get the user who made the reservation
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the restaurant for this reservation
     */
    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    /**
     * Check if reservation can be cancelled
     */
    public function canBeCancelled(): bool
    {
        $reservationDateTime = $this->reservation_date . ' ' . $this->reservation_time;
        $hoursUntilReservation = now()->diffInHours($reservationDateTime, false);
        
        return $hoursUntilReservation >= 2 && in_array($this->status, ['pending', 'confirmed']);
    }

    /**
     * Generate a confirmation code
     */
    public static function generateConfirmationCode(): string
    {
        return 'RES-' . strtoupper(substr(md5(uniqid()), 0, 8)) . '-' . date('md');
    }

    /**
     * Scope for upcoming reservations
     */
    public function scopeUpcoming($query)
    {
        return $query->where('reservation_date', '>=', now()->toDateString())
                     ->whereIn('status', ['pending', 'confirmed'])
                     ->orderBy('reservation_date')
                     ->orderBy('reservation_time');
    }

    /**
     * Scope for past reservations
     */
    public function scopePast($query)
    {
        return $query->where(function($q) {
                $q->where('reservation_date', '<', now()->toDateString())
                  ->orWhere(function($q2) {
                      $q2->where('reservation_date', '=', now()->toDateString())
                         ->where('reservation_time', '<', now()->format('H:i'));
                  });
            })
            ->orderBy('reservation_date', 'desc')
            ->orderBy('reservation_time', 'desc');
    }
}