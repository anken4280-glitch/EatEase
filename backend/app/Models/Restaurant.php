<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use App\Models\User; // ADD THIS LINE


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
        'occupancy_percentage', // ✅ ADD THIS
        'crowd_status', // ✅ ADD THIS
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
        'menu_description',
        'average_rating',
        'total_reviews',
        'subscription_tier',
        'subscription_ends_at',
        'can_be_featured',
        'can_run_ads',
        'has_analytics_access',
        'has_api_access',
        'profile_image',
        'banner_image',
        'banner_position'
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
        'occupancy_percentage' => 'float', // ✅ ADD THIS
        'current_occupancy' => 'integer', // ✅ ADD THIS
        'max_capacity' => 'integer', // ✅ ADD THIS
    ];

    protected $appends = ['profile_image_url', 'banner_image_url'];

    // Add this method to Restaurant model:
    protected static function booted()
    {
        static::updated(function ($restaurant) {
            // Log occupancy whenever it changes
            if ($restaurant->isDirty('current_occupancy')) {
                $oldValue = $restaurant->getOriginal('current_occupancy');
                $newValue = $restaurant->current_occupancy;

                // Only log if there's an actual change
                if ($oldValue != $newValue) {
                    \App\Models\OccupancyLog::create([
                        'restaurant_id' => $restaurant->id,
                        'occupancy_count' => $newValue,
                        'occupancy_percentage' => $restaurant->occupancy_percentage,
                        'crowd_status' => $restaurant->crowd_status,
                        'source_type' => 'manual',
                        'is_estimated' => true,
                        'notes' => 'Updated via restaurant profile'
                    ]);
                }
            }
        });
    }

    public function getProfileImageUrlAttribute()
    {
        if (!$this->profile_image) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($this->profile_image, FILTER_VALIDATE_URL)) {
            return $this->profile_image;
        }

        // Otherwise, generate the full URL
        return asset('storage/' . $this->profile_image);
    }

    public function getBannerImageUrlAttribute()
    {
        if (!$this->banner_image) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($this->banner_image, FILTER_VALIDATE_URL)) {
            return $this->banner_image;
        }

        // Otherwise, generate the full URL
        return asset('storage/' . $this->banner_image);
    }

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

    // Add this method in the Restaurant class
    public function logOccupancy($occupancyCount, $sourceType = 'manual', $notes = null)
    {
        $percentage = $this->max_capacity > 0
            ? round(($occupancyCount / $this->max_capacity) * 100, 2)
            : 0;

        // Determine crowd status based on percentage
        if ($percentage <= 50) {
            $status = 'green';
        } elseif ($percentage <= 79) {
            $status = 'yellow';
        } elseif ($percentage <= 89) {
            $status = 'orange';
        } else {
            $status = 'red';
        }

        // Create log entry
        return OccupancyLog::create([
            'restaurant_id' => $this->id,
            'occupancy_count' => $occupancyCount,
            'occupancy_percentage' => $percentage,
            'crowd_status' => $status,
            'source_type' => $sourceType,
            'is_estimated' => $sourceType === 'manual',
            'notes' => $notes
        ]);
    }



    protected static function boot()
    {
        parent::boot();

        static::updated(function ($restaurant) {
            // Check if crowd status changed
            if ($restaurant->isDirty('crowd_status')) {
                Log::info("Crowd status changed for {$restaurant->name}: {$restaurant->crowd_status}");

                // CALL NOTIFICATION LOGIC DIRECTLY (no job)
                self::checkAndCreateNotifications($restaurant);
            }
        });

        static::saving(function ($restaurant) {
            // Your existing saving logic...
            if ($restaurant->max_capacity > 0) {
                $restaurant->occupancy_percentage =
                    round(($restaurant->current_occupancy / $restaurant->max_capacity) * 100);

                // 4-tier crowd status
                if ($restaurant->occupancy_percentage <= 50) {
                    $newStatus = 'green';
                } elseif ($restaurant->occupancy_percentage <= 79) {
                    $newStatus = 'yellow';
                } elseif ($restaurant->occupancy_percentage <= 89) {
                    $newStatus = 'orange';
                } else {
                    $newStatus = 'red';
                }

                // Check if status changed
                if ($restaurant->crowd_status !== $newStatus) {
                    $restaurant->crowd_status = $newStatus;
                }
            }
        });
    }

    // Add this method anywhere in the Restaurant class (after boot method):

    /**
     * Check user preferences and create notifications when crowd status matches
     */
    public static function checkAndCreateNotifications(Restaurant $restaurant)
    {
        try {
            Log::info("Checking notifications for restaurant {$restaurant->id} ({$restaurant->name})");

            // Find users who want notifications for this status
            $preferences = \App\Models\UserNotification::with('user')
                ->where('restaurant_id', $restaurant->id)
                ->where('notify_when_status', $restaurant->crowd_status)
                ->where('is_active', true)
                ->get();

            Log::info("Found {$preferences->count()} preferences for status: {$restaurant->crowd_status}");

            $createdCount = 0;
            foreach ($preferences as $preference) {
                // Check if notification already sent recently (last 6 hours)
                $recentNotification = \App\Models\NotificationLog::where('user_id', $preference->user_id)
                    ->where('restaurant_id', $restaurant->id)
                    ->where('status', $restaurant->crowd_status)
                    ->where('sent_at', '>=', now()->subHours(6))
                    ->exists();

                if (!$recentNotification) {
                    // Create notification
                    \App\Models\NotificationLog::create([
                        'user_id' => $preference->user_id,
                        'restaurant_id' => $restaurant->id,
                        'notification_type' => 'crowd_alert',
                        'title' => "Crowd Alert: {$restaurant->name}",
                        'message' => "{$restaurant->name} has reached {$restaurant->crowd_level} crowd level",
                        'status' => $restaurant->crowd_status,
                        'is_read' => false,
                        'sent_at' => now(),
                    ]);

                    $createdCount++;
                    Log::info("✓ Notification created for user {$preference->user_id}");
                }
            }

            Log::info("Created {$createdCount} notifications for restaurant {$restaurant->id}");
            return $createdCount;
        } catch (\Exception $e) {
            Log::error("Notification check failed: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return 0;
        }
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
