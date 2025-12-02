<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('cuisine_type');
            $table->text('address');
            $table->string('phone');
            $table->string('hours');

            // CAPACITY FIELDS
            $table->integer('max_capacity')->default(50);
            $table->integer('occupancy_percentage')->default(0);

            // 🚦 ENUM FIELD
            $table->enum('crowd_status', ['green', 'yellow', 'orange', 'red'])->default('green');

            $table->json('features')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index('owner_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('restaurants');
    }
};
