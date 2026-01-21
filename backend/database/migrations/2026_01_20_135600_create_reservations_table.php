<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->integer('party_size')->default(2);
            $table->date('reservation_date');
            $table->time('reservation_time');
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])->default('pending');
            $table->text('special_requests')->nullable();
            $table->string('confirmation_code')->nullable();
            $table->integer('notification_count')->default(0);
            $table->timestamp('last_notified_at')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['restaurant_id', 'reservation_date', 'status']);
            $table->index(['user_id', 'reservation_date']);
            $table->index(['reservation_date', 'reservation_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};