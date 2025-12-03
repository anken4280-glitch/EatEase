<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeatureRequest extends Model
{
    use HasFactory;

    protected $table = 'feature_requests';

    protected $fillable = [
        'restaurant_id',
        'featured_description',
        'status',
        'reviewed_by',
        'admin_notes'
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime'
    ];

    // Relationship with Restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // Relationship with Admin who reviewed
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}