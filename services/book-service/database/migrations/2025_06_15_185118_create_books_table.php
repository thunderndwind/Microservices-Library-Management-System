<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('author');
            $table->string('isbn', 13)->unique()->nullable();
            $table->text('description')->nullable();
            $table->integer('quantity')->default(1);
            $table->integer('available_quantity')->default(1);
            $table->uuid('created_by')->nullable(); // Admin/Librarian who added the book
            $table->uuid('updated_by')->nullable(); // Admin/Librarian who last updated the book
            $table->timestamps();

            // Indexes for better performance
            $table->index(['title']);
            $table->index(['author']);
            $table->index(['isbn']);
            $table->index(['available_quantity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};