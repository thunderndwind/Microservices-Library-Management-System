<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Http\Requests\BookRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Services\EventService;

class BookController extends Controller
{
    protected $eventService;

    public function __construct(EventService $eventService)
    {
        $this->eventService = $eventService;
    }

    /**
     * Display a listing of books with pagination and search.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min($request->get('limit', 10), 100); // Max 100 per page
            $search = $request->get('search', '');

            $query = Book::query();

            if (!empty($search)) {
                $query->search($search);
            }

            $books = $query->orderBy('title')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Books retrieved successfully',
                'data' => [
                    'books' => $books->items(),
                    'pagination' => [
                        'current_page' => $books->currentPage(),
                        'total_pages' => $books->lastPage(),
                        'total_books' => $books->total(),
                        'per_page' => $books->perPage(),
                        'has_next' => $books->hasMorePages(),
                        'has_prev' => $books->currentPage() > 1,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving books: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve books'
            ], 500);
        }
    }

    /**
     * Store a newly created book.
     */
    public function store(BookRequest $request): JsonResponse
    {
        try {
            $adminId = $request->header('X-Admin-ID'); // From auth middleware

            $book = Book::create([
                'title' => $request->title,
                'author' => $request->author,
                'isbn' => $request->isbn,
                'description' => $request->description,
                'quantity' => $request->quantity,
                'available_quantity' => $request->quantity,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ]);

            // Publish book created event
            $this->eventService->publishBookCreated($book, $adminId);

            return response()->json([
                'success' => true,
                'message' => 'Book created successfully',
                'data' => [
                    'book' => $book->toArray()
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating book: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create book'
            ], 500);
        }
    }

    /**
     * Display the specified book.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $book = Book::find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'message' => 'Book not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Book retrieved successfully',
                'data' => [
                    'book' => $book->toArray()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving book: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve book'
            ], 500);
        }
    }

    /**
     * Update the specified book.
     */
    public function update(BookRequest $request, string $id): JsonResponse
    {
        try {
            $book = Book::find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'message' => 'Book not found'
                ], 404);
            }

            $adminId = $request->header('X-Admin-ID'); // From auth middleware

            // Calculate new available quantity if total quantity changed
            $quantityDiff = $request->quantity - $book->quantity;
            $newAvailableQuantity = $book->available_quantity + $quantityDiff;

            // Ensure available quantity doesn't go negative
            $newAvailableQuantity = max(0, $newAvailableQuantity);

            $book->update([
                'title' => $request->title,
                'author' => $request->author,
                'isbn' => $request->isbn,
                'description' => $request->description,
                'quantity' => $request->quantity,
                'available_quantity' => $newAvailableQuantity,
                'updated_by' => $adminId,
            ]);

            // Publish book updated event
            $this->eventService->publishBookUpdated($book, $adminId);

            return response()->json([
                'success' => true,
                'message' => 'Book updated successfully',
                'data' => [
                    'book' => $book->fresh()->toArray()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating book: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update book'
            ], 500);
        }
    }

    /**
     * Remove the specified book.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $book = Book::find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'message' => 'Book not found'
                ], 404);
            }

            // Check if book has active reservations
            if ($book->available_quantity < $book->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete book with active reservations'
                ], 400);
            }

            $book->delete();

            return response()->json([
                'success' => true,
                'message' => 'Book deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting book: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete book'
            ], 500);
        }
    }

    /**
     * Search books by query and type.
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $query = $request->get('q', '');
            $type = $request->get('type', 'all'); // title, author, isbn, or all
            $perPage = min($request->get('limit', 10), 100);

            if (empty($query)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Search query is required'
                ], 400);
            }

            $bookQuery = Book::query();

            switch ($type) {
                case 'title':
                    $bookQuery->where('title', 'LIKE', "%{$query}%");
                    break;
                case 'author':
                    $bookQuery->where('author', 'LIKE', "%{$query}%");
                    break;
                case 'isbn':
                    $bookQuery->where('isbn', 'LIKE', "%{$query}%");
                    break;
                default:
                    $bookQuery->search($query);
                    break;
            }

            $books = $bookQuery->orderBy('title')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Search completed successfully',
                'data' => [
                    'books' => $books->items(),
                    'search_query' => $query,
                    'search_type' => $type,
                    'pagination' => [
                        'current_page' => $books->currentPage(),
                        'total_pages' => $books->lastPage(),
                        'total_books' => $books->total(),
                        'per_page' => $books->perPage(),
                        'has_next' => $books->hasMorePages(),
                        'has_prev' => $books->currentPage() > 1,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching books: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Search failed'
            ], 500);
        }
    }

    /**
     * Check book availability.
     */
    public function availability(string $id): JsonResponse
    {
        try {
            $book = Book::find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'message' => 'Book not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Book availability retrieved successfully',
                'data' => $book->availability
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking book availability: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check availability'
            ], 500);
        }
    }

    /**
     * Health check endpoint.
     */
    public function health(): JsonResponse
    {
        try {
            $totalBooks = Book::count();
            $availableBooks = Book::where('available_quantity', '>', 0)->count();

            return response()->json([
                'success' => true,
                'message' => 'Book service is healthy',
                'data' => [
                    'timestamp' => now()->toISOString(),
                    'uptime' => round(microtime(true) - LARAVEL_START, 3),
                    'total_books' => $totalBooks,
                    'available_books' => $availableBooks,
                    'memory_usage' => [
                        'current' => memory_get_usage(true),
                        'peak' => memory_get_peak_usage(true),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Health check error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Service unhealthy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reserve books (internal service endpoint).
     */
    public function reserveBook(Request $request, string $id): JsonResponse
    {
        try {
            $book = Book::find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'message' => 'Book not found'
                ], 404);
            }

            $quantity = $request->get('quantity', 1);

            if (!$book->isAvailable($quantity)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient books available'
                ], 400);
            }

            $success = $book->reserve($quantity);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Book reserved successfully',
                    'data' => [
                        'book' => $book->fresh()->toArray(),
                        'reserved_quantity' => $quantity
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to reserve book'
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Error reserving book: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reserve book'
            ], 500);
        }
    }

    /**
     * Return books (internal service endpoint).
     */
    public function returnBook(Request $request, string $id): JsonResponse
    {
        try {
            $book = Book::find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'message' => 'Book not found'
                ], 404);
            }

            $quantity = $request->get('quantity', 1);
            $success = $book->returnBooks($quantity);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Book returned successfully',
                    'data' => [
                        'book' => $book->fresh()->toArray(),
                        'returned_quantity' => $quantity
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to return book'
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Error returning book: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to return book'
            ], 500);
        }
    }
}