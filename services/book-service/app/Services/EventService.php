<?php

namespace App\Services;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use Illuminate\Support\Facades\Log;

class EventService
{
    protected $connection;
    protected $channel;
    protected $exchange;

    public function __construct()
    {
        $this->exchange = config('queue.connections.rabbitmq.exchange', 'library_events');
        $this->connect();
    }

    protected function connect()
    {
        try {
            $config = config('queue.connections.rabbitmq');

            $this->connection = new AMQPStreamConnection(
                $config['host'] ?? 'localhost',
                $config['port'] ?? 5672,
                $config['user'] ?? 'guest',
                $config['password'] ?? 'guest',
                $config['vhost'] ?? '/'
            );

            $this->channel = $this->connection->channel();

            // Declare exchange
            $this->channel->exchange_declare(
                $this->exchange,
                'topic',
                false,
                true,
                false
            );

            Log::info('Connected to RabbitMQ');
        } catch (\Exception $e) {
            Log::error('Failed to connect to RabbitMQ: ' . $e->getMessage());
            // Don't throw error - service should work without message broker
        }
    }

    public function publishEvent(string $eventType, array $data)
    {
        try {
            if (!$this->channel) {
                Log::warning('RabbitMQ not connected, skipping event publication');
                return;
            }

            $event = [
                'eventType' => $eventType,
                'timestamp' => now()->toISOString(),
                'source' => 'book-service',
                'data' => $data,
            ];

            $message = new AMQPMessage(
                json_encode($event),
                ['delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT]
            );

            $routingKey = str_replace('.', '_', $eventType);

            $this->channel->basic_publish(
                $message,
                $this->exchange,
                $routingKey
            );

            Log::info("Event published: {$eventType}", $data);
        } catch (\Exception $e) {
            Log::error('Failed to publish event: ' . $e->getMessage());
        }
    }

    public function publishBookCreated($book, $adminId)
    {
        $this->publishEvent('book.created', [
            'bookId' => $book->id,
            'title' => $book->title,
            'author' => $book->author,
            'isbn' => $book->isbn,
            'quantity' => $book->quantity,
            'createdBy' => $adminId,
        ]);
    }

    public function publishBookUpdated($book, $adminId)
    {
        $this->publishEvent('book.updated', [
            'bookId' => $book->id,
            'title' => $book->title,
            'author' => $book->author,
            'isbn' => $book->isbn,
            'quantity' => $book->quantity,
            'updatedBy' => $adminId,
        ]);
    }

    public function publishBookDeleted($bookId, $adminId)
    {
        $this->publishEvent('book.deleted', [
            'bookId' => $bookId,
            'deletedBy' => $adminId,
        ]);
    }

    public function __destruct()
    {
        try {
            if ($this->channel) {
                $this->channel->close();
            }
            if ($this->connection) {
                $this->connection->close();
            }
        } catch (\Exception $e) {
            Log::error('Error closing RabbitMQ connection: ' . $e->getMessage());
        }
    }
}