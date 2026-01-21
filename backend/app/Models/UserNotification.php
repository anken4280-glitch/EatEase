<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class UserNotification extends Model
{
    use HasFactory;

    protected $table = 'user_notifications';

    protected $fillable = [
        'user_id',
        'restaurant_id',
        'notify_when_status',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
    public static function getUserNotifications($userId)
    {
        $cacheKey = "user_notifications_{$userId}";
        $cacheTime = 60; // 1 minute cache

        return Cache::remember($cacheKey, $cacheTime, function () use ($userId) {
            return self::with(['restaurant:id,name,cuisine_type,address'])
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->get()
                ->keyBy('restaurant_id'); // Key by restaurant_id for fast lookup
        });
    }
}
