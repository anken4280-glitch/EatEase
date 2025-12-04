<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantPhoto extends Model
{
    protected $fillable = [
        'restaurant_id', 
        'image_url', 
        'caption', 
        'is_primary', 
        'uploaded_by'
    ];
    
    protected $casts = [
        'is_primary' => 'boolean'
    ];
    
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
    
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}