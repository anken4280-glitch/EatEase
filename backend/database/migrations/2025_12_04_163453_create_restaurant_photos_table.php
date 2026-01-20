<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRestaurantPhotosTable extends Migration
{
    public function up()
    {
        Schema::create('restaurant_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('image_path');  // Store relative path
            $table->string('caption')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('set null');
            $table->integer('display_order')->default(0);
            $table->timestamps();
            
            // Index for faster queries
            $table->index(['restaurant_id', 'is_primary']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('restaurant_photos');
    }
}