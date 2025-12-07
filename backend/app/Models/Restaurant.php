<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'cuisine_type',
        'address',
        'phone',
        'hours',
        'max_capacity',
        'current_occupancy',
        'features',
        'is_featured',
        // Add verification fields
        'is_verified',
        'verification_requested',
        'verification_requested_at',
        'verified_at',
        'verified_by',
        'is_suspended',
        'suspended_at',
        'suspended_reason',
        'admin_notes',
        'menu-description',
        'average_rating',
        'total_reviews'
    ];

    protected $casts = [
        'features' => 'array',
        'is_featured' => 'boolean',
        // Add verification casts
        'is_verified' => 'boolean',
        'verification_requested' => 'boolean',
        'is_suspended' => 'boolean',
        'verification_requested_at' => 'datetime',
        'verified_at' => 'datetime',
        'suspended_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($restaurant) {
            // Calculate occupancy percentage
            if ($restaurant->max_capacity > 0) {
                $restaurant->occupancy_percentage =
                    round(($restaurant->current_occupancy / $restaurant->max_capacity) * 100);

                // 4-tier crowd status
                if ($restaurant->occupancy_percentage <= 50) {
                    $restaurant->crowd_status = 'green';
                } elseif ($restaurant->occupancy_percentage <= 79) {
                    $restaurant->crowd_status = 'yellow';
                } elseif ($restaurant->occupancy_percentage <= 89) {
                    $restaurant->crowd_status = 'orange';
                } else {
                    $restaurant->crowd_status = 'red';
                }
            }
        });
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function getCrowdLevelAttribute()
    {
        switch ($this->crowd_status) {
            case 'green':
                return 'Low';
            case 'yellow':
                return 'Moderate';
            case 'orange':
                return 'High';
            case 'red':
                return 'Full';
            default:
                return 'Unknown';
        }
    }

    // Add these helpful methods
    public function isVerificationPending()
    {
        return $this->verification_requested && !$this->is_verified;
    }

    public function canRequestVerification()
    {
        return !$this->is_verified && !$this->verification_requested;
    }

    public function getVerificationStatusAttribute()
    {
        if ($this->is_verified) {
            return 'verified';
        } elseif ($this->verification_requested) {
            return 'pending';
        } else {
            return 'not_requested';
        }
    }
}
