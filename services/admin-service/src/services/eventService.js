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
                source: "admin-service",
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

    async publishAdminRegistered(admin, createdBy) {
        await this.publishEvent("admin.registered", {
            adminId: admin._id.toString(),
            email: admin.email,
            firstName: admin.firstName,
            role: admin.role,
            createdBy: {
                adminId: createdBy._id.toString(),
                email: createdBy.email,
                role: createdBy.role,
            },
        });
    }

    async publishUserSuspended(userId, suspendedBy, reason) {
        await this.publishEvent("user.suspended", {
            userId: userId,
            suspendedBy: suspendedBy,
            reason: reason || "No reason provided",
        });
    }

    async publishAdminLogin(admin) {
        await this.publishEvent("admin.login", {
            adminId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            loginTime: new Date().toISOString(),
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
