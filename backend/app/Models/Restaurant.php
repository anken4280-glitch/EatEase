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
        'total_reviews',
        'subscription_tier',
        'subscription_ends_at',
        'can_be_featured',
        'can_run_ads',
        'has_analytics_access',
        'has_api_access'
    ];

    protected $casts = [
        'features' => 'array',
        'is_featured' => 'boolean',
        'is_verified' => 'boolean',
        'verification_requested' => 'boolean',
        'is_suspended' => 'boolean',
        'verification_requested_at' => 'datetime',
        'verified_at' => 'datetime',
        'suspended_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'can_be_featured' => 'boolean',
        'can_run_ads' => 'boolean',
        'has_analytics_access' => 'boolean',
        'has_api_access' => 'boolean',
    ];

    public function isPremium(): bool
    {
        return $this->subscription_tier === 'premium' &&
            ($this->subscription_ends_at === null ||
                $this->subscription_ends_at->isFuture());
    }

    public function isBasic(): bool
    {
        return $this->subscription_tier === 'basic';
    }

    public function upgradeToPremium(): void
    {
        $this->update([
            'subscription_tier' => 'premium',
            'subscription_ends_at' => now()->addMonth(), // 1 month from now
            'can_be_featured' => true,
            'can_run_ads' => true,
            'has_analytics_access' => true,
            'has_api_access' => true,
        ]);
    }

    public function downgradeToBasic(): void
    {
        $this->update([
            'subscription_tier' => 'basic',
            'subscription_ends_at' => null,
            'can_be_featured' => false,
            'can_run_ads' => false,
            'has_analytics_access' => false,
            'has_api_access' => false,
        ]);
    }

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
