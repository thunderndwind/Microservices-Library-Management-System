<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\EventService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(EventService::class, function ($app) {
            return new EventService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}