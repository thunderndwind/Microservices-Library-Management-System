<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookController;
use App\Http\Middleware\AuthMiddleware;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
Route::prefix('v1')->group(function () {
    // Health check
    Route::get('/health', [BookController::class, 'health']);

    // Public book browsing (read-only)
    Route::get('/books', [BookController::class, 'index']);
    Route::get('/books/search', [BookController::class, 'search']);
    Route::get('/books/{id}', [BookController::class, 'show']);
    Route::get('/books/{id}/availability', [BookController::class, 'availability']);
});

// Protected routes (require authentication)
Route::prefix('v1')->middleware([AuthMiddleware::class])->group(function () {
    // Book management (Admin/Librarian only)
    Route::post('/books', [BookController::class, 'store']);
    Route::put('/books/{id}', [BookController::class, 'update']);
    Route::delete('/books/{id}', [BookController::class, 'destroy']);
});

// Internal routes for service-to-service communication
Route::prefix('v1/internal')->middleware([AuthMiddleware::class])->group(function () {
    // These routes are for other services to call
    Route::post('/books/{id}/reserve', [BookController::class, 'reserveBook']);
    Route::post('/books/{id}/return', [BookController::class, 'returnBook']);
});