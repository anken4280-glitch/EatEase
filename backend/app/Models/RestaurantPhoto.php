<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestaurantPhoto extends Model
{
    use HasFactory;

    // Disable timestamps since updated_at column is missing
    public $timestamps = false;
    
    // Or enable only created_at
    // const CREATED_AT = 'created_at';
    // const UPDATED_AT = null;

    protected $fillable = [
        'restaurant_id', 
        'image_url',
        'caption', 
        'is_primary', 
        'uploaded_by'
        // No display_order - column doesn't exist
    ];
    
    protected $casts = [
        'is_primary' => 'boolean'
    ];
    
    // FIXED: Accessor that avoids conflict
    public function getFullImageUrlAttribute()
    {
        // Access the raw database column value
        $imageUrl = $this->attributes['image_url'] ?? null;
        
        if (!$imageUrl) {
            return null;
        }
        
        if (str_starts_with($imageUrl, 'http')) {
            return $imageUrl;
        }
        
        return 'http://localhost/EatEase/backend/public/storage/' . $imageUrl;
    }
    
    // Append the computed attribute
    protected $appends = ['full_image_url'];
    
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
    
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
    
    // Scope for primary photo
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }
    
    // FIXED: Remove display_order reference
    public function scopeOrdered($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}