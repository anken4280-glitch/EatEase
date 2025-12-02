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
        'current_occupancy', // CRITICAL: Was missing!
        'features',
        'is_featured'
    ];

    protected $casts = [
        'features' => 'array',
        'is_featured' => 'boolean'
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
    
    public function getCrowdLevelAttribute()
    {
        switch ($this->crowd_status) {
            case 'green': return 'Low';
            case 'yellow': return 'Moderate';
            case 'orange': return 'High';
            case 'red': return 'Full';
            default: return 'Unknown';
        }
    }
}