<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMenuItemsTable extends Migration
{
    public function up()
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->text('description')->nullable(); // Simple text description
            $table->timestamps();
            
            //Ensure One menu per restaurant
            $table->unique(['restaurant_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('menu_items');
    }
}
