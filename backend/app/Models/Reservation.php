<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User; // ✅ ADD THIS
use App\Models\Restaurant; // ✅ ADD THIS
use Illuminate\Support\Facades\Log;

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
        'last_notified_at',
        'hold_type',      // ← ADD THIS
        'expires_at',     // ← ADD THIS
        'hold_status',
        'is_hidden' // ✅ ADD THIS LINE
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'last_notified_at' => 'datetime',
        'party_size' => 'integer',
        'expires_at' => 'datetime', // ← ADD THIS
        'is_hidden' => 'boolean' // ✅ ADD THIS LINE

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

        public function isExpired(): bool
    {
        if ($this->status !== 'pending_hold') {
            return false;
        }

        if (!$this->expires_at) {
            return false;
        }

        $expiresAt = new \DateTime($this->expires_at);
        $now = new \DateTime();
        return $expiresAt < $now;
    }

    /**
     * Auto-update status if hold is expired
     */
    public static function boot()
    {
        parent::boot();

        static::saving(function ($reservation) {
            // Auto-update expired holds
            if ($reservation->status === 'pending_hold' && $reservation->expires_at) {
                $expiresAt = new \DateTime($reservation->expires_at);
                $now = new \DateTime();
                
                if ($expiresAt < $now) {
                    $reservation->status = 'cancelled';
                    $reservation->hold_status = 'rejected';
                }
            }
        });
    }

    /**
     * Check if reservation can be cancelled
     */
    // Option 1: Remove it completely and handle logic in controller
    // Option 2: Keep it simple
    public function canBeCancelled(): bool
    {
        // Only pending holds can be cancelled
        if ($this->status !== 'pending_hold') {
            return false;
        }

        // Check if already expired
        if ($this->expires_at) {
            $expiresAt = new \DateTime($this->expires_at);
            $now = new \DateTime();
            return $expiresAt > $now; // Can cancel if not expired
        }

        return true;
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
        return $query->where(function ($q) {
            $q->where('reservation_date', '<', now()->toDateString())
                ->orWhere(function ($q2) {
                    $q2->where('reservation_date', '=', now()->toDateString())
                        ->where('reservation_time', '<', now()->format('H:i'));
                });
        })
            ->orderBy('reservation_date', 'desc')
            ->orderBy('reservation_time', 'desc');
    }
}
