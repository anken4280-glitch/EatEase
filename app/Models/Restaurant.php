<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'cuisine_type', 'address'];

    public function status()
    {
        return $this->hasOne(\App\Models\RestaurantStatus::class, 'restaurant_id');
    }
}