<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'restaurant_id', 
        'user_id', 
        'rating', 
        'comment', 
        'images'
    ];
    
    protected $casts = [
        'rating' => 'integer',
        'images' => 'array'
    ];
    
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}