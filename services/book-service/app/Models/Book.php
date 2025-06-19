<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Book extends Model
{
    use HasFactory;

    /**
     * Indicates if the model's ID is auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The data type of the auto-incrementing ID.
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'title',
        'author',
        'isbn',
        'description',
        'quantity',
        'available_quantity',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'quantity' => 'integer',
        'available_quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }

            // Set available_quantity to quantity if not set
            if (is_null($model->available_quantity)) {
                $model->available_quantity = $model->quantity;
            }
        });
    }

    /**
     * Scope to search books by title, author, or ISBN.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'LIKE', "%{$search}%")
                ->orWhere('author', 'LIKE', "%{$search}%")
                ->orWhere('isbn', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Scope to get available books.
     */
    public function scopeAvailable($query)
    {
        return $query->where('available_quantity', '>', 0);
    }

    /**
     * Check if the book is available for reservation.
     */
    public function isAvailable($requestedQuantity = 1)
    {
        return $this->available_quantity >= $requestedQuantity;
    }

    /**
     * Reserve books (decrease available quantity).
     */
    public function reserve($quantity = 1)
    {
        if ($this->available_quantity >= $quantity) {
            $this->decrement('available_quantity', $quantity);
            return true;
        }
        return false;
    }

    /**
     * Return books (increase available quantity).
     */
    public function returnBooks($quantity = 1)
    {
        $newAvailableQuantity = $this->available_quantity + $quantity;

        // Don't exceed total quantity
        if ($newAvailableQuantity > $this->quantity) {
            $newAvailableQuantity = $this->quantity;
        }

        $this->update(['available_quantity' => $newAvailableQuantity]);
        return true;
    }

    /**
     * Get the book's availability status.
     */
    public function getAvailabilityAttribute()
    {
        return [
            'available' => $this->available_quantity > 0,
            'quantity' => $this->quantity,
            'available_quantity' => $this->available_quantity,
            'reserved' => $this->quantity - $this->available_quantity,
        ];
    }

    /**
     * Format the book for API response.
     */
    public function toArray()
    {
        $array = parent::toArray();
        $array['availability'] = $this->availability;
        return $array;
    }
}