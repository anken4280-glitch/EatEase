<?php
// app/Models/OccupancyLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OccupancyLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'occupancy_count',
        'occupancy_percentage',
        'crowd_status',
        'source_type',
        'sensor_id',
        'is_estimated',
        'notes'
    ];

    protected $casts = [
        'occupancy_count' => 'integer',
        'occupancy_percentage' => 'float',
        'is_estimated' => 'boolean',
        'created_at' => 'datetime'
    ];

    /**
     * Relationship with Restaurant
     */
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    /**
     * Scope for manual entries
     */
    public function scopeManual($query)
    {
        return $query->where('source_type', 'manual');
    }

    /**
     * Scope for sensor entries
     */
    public function scopeSensor($query)
    {
        return $query->where('source_type', 'like', 'sensor%');
    }

    /**
     * Scope for time range
     */
    public function scopeForPeriod($query, $startDate, $endDate = null)
    {
        $endDate = $endDate ?? now();
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}