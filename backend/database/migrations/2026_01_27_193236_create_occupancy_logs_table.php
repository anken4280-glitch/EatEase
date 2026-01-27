<?php
// database/migrations/2024_01_23_create_occupancy_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOccupancyLogsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('occupancy_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->integer('occupancy_count')->default(0);
            $table->decimal('occupancy_percentage', 5, 2)->default(0);
            $table->enum('crowd_status', ['green', 'yellow', 'orange', 'red'])->default('green');
            $table->enum('source_type', ['manual', 'sensor_esp32', 'sensor_other'])->default('manual');
            $table->string('sensor_id')->nullable(); // For ESP32 sensors later
            $table->boolean('is_estimated')->default(false); // True for manual entries
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['restaurant_id', 'created_at']);
            $table->index(['source_type', 'created_at']);
            $table->index('crowd_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('occupancy_logs');
    }
}