const amqp = require("amqplib");

class EventService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = process.env.RABBITMQ_EXCHANGE || "library_events";
    }

    async connect() {
        try {
            const rabbitmqUrl =
                process.env.RABBITMQ_URL || "amqp://localhost:5672";
            this.connection = await amqp.connect(rabbitmqUrl);
            this.channel = await this.connection.createChannel();

            // Declare exchange
            await this.channel.assertExchange(this.exchange, "topic", {
                durable: true,
            });

            console.log("Connected to RabbitMQ");
        } catch (error) {
            console.error("Failed to connect to RabbitMQ:", error.message);
            // Don't throw error - service should work without message broker
        }
    }

    async publishEvent(eventType, data) {
        try {
            if (!this.channel) {
                console.warn(
                    "RabbitMQ not connected, skipping event publication"
                );
                return;
            }

            const event = {
                eventType,
                timestamp: new Date().toISOString(),
                source: "user-service",
                data,
            };

            const routingKey = eventType.replace(".", "_");
            await this.channel.publish(
                this.exchange,
                routingKey,
                Buffer.from(JSON.stringify(event)),
                { persistent: true }
            );

            console.log(`Event published: ${eventType}`, data);
        } catch (error) {
            console.error("Failed to publish event:", error.message);
        }
    }

    async publishUserRegistered(user) {
        await this.publishEvent("user.registered", {
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            type: "member",
        });
    }

    async publishUserProfileUpdated(user) {
        await this.publishEvent("user.profile_updated", {
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        });
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log("RabbitMQ connection closed");
        } catch (error) {
            console.error("Error closing RabbitMQ connection:", error.message);
        }
    }
}

// Create singleton instance
const eventService = new EventService();

// Handle graceful shutdown
process.on("SIGINT", async () => {
    await eventService.close();
});

process.on("SIGTERM", async () => {
    await eventService.close();
});

module.exports = eventService;
