<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('restaurant_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('notification_type'); // 'crowd_alert', 'reservation', etc.
            $table->string('title');
            $table->text('message');
            $table->enum('status', ['green', 'yellow', 'orange', 'red'])->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'is_read']);
            $table->index(['restaurant_id', 'sent_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('notification_logs');
    }
};