<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddImageColumnsToRestaurantsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('profile_image')->nullable()->after('menu_description');
            $table->string('banner_image')->nullable()->after('profile_image');
            $table->string('banner_position')->default('center')->after('banner_image');
        });
    }

    public function down()
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['profile_image', 'banner_image', 'banner_position']);
        });
    }
}
