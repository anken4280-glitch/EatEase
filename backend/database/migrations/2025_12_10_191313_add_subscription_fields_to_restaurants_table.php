<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            // Add subscription tier (basic or premium)
            $table->enum('subscription_tier', ['basic', 'premium'])->default('basic');
            
            // Add subscription end date (for premium)
            $table->timestamp('subscription_ends_at')->nullable();
            
            // Add feature flags
            $table->boolean('can_be_featured')->default(false);
            $table->boolean('can_run_ads')->default(false);
            $table->boolean('has_analytics_access')->default(false);
            $table->boolean('has_api_access')->default(false);
            
            // Add index for performance
            $table->index('subscription_tier');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_tier',
                'subscription_ends_at',
                'can_be_featured',
                'can_run_ads',
                'has_analytics_access',
                'has_api_access'
            ]);
        });
    }
};