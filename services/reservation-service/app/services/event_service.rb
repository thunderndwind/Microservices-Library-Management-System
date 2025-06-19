class EventService
  include Singleton
  
  def initialize
    @connection = nil
    @channel = nil
    @exchange_name = ENV.fetch('RABBITMQ_EXCHANGE', 'library_events')
    connect
  end
  
  def self.publish_event(event_type, data)
    instance.publish_event(event_type, data)
  end
  
  def publish_event(event_type, data)
    return unless connected?
    
    event = {
      eventType: event_type,
      timestamp: Time.current.iso8601,
      source: 'reservation-service',
      data: data
    }
    
    routing_key = event_type.gsub('.', '_')
    
    @exchange.publish(
      event.to_json,
      routing_key: routing_key,
      persistent: true,
      content_type: 'application/json'
    )
    
    Rails.logger.info "Event published: #{event_type} with data: #{data}"
  rescue => e
    Rails.logger.error "Failed to publish event #{event_type}: #{e.message}"
  end
  
  def connected?
    @connection && @connection.open? && @channel && @channel.open?
  end
  
  def connect
    return if connected?
    
    begin
      rabbitmq_url = ENV.fetch('RABBITMQ_URL', 'amqp://localhost:5672')
      @connection = Bunny.new(rabbitmq_url)
      @connection.start
      
      @channel = @connection.create_channel
      @exchange = @channel.topic(@exchange_name, durable: true)
      
      Rails.logger.info "Connected to RabbitMQ at #{rabbitmq_url}"
    rescue => e
      Rails.logger.error "Failed to connect to RabbitMQ: #{e.message}"
      @connection = nil
      @channel = nil
      @exchange = nil
    end
  end
  
  def disconnect
    return unless connected?
    
    begin
      @channel&.close
      @connection&.close
      Rails.logger.info "Disconnected from RabbitMQ"
    rescue => e
      Rails.logger.error "Error disconnecting from RabbitMQ: #{e.message}"
    ensure
      @connection = nil
      @channel = nil
      @exchange = nil
    end
  end
  
  def reconnect
    disconnect
    connect
  end
  
  # Specific event publishing methods
  def self.publish_reservation_created(reservation)
    publish_event('reservation.created', {
      reservationId: reservation.id,
      userId: reservation.user_id,
      bookId: reservation.book_id,
      dueDate: reservation.due_date.iso8601,
      status: reservation.status
    })
  end
  
  def self.publish_reservation_returned(reservation)
    publish_event('reservation.returned', {
      reservationId: reservation.id,
      userId: reservation.user_id,
      bookId: reservation.book_id,
      returnDate: reservation.returned_at.iso8601,
      status: reservation.status
    })
  end
  
  def self.publish_reservation_overdue(reservation)
    publish_event('reservation.overdue', {
      reservationId: reservation.id,
      userId: reservation.user_id,
      bookId: reservation.book_id,
      dueDate: reservation.due_date.iso8601,
      daysOverdue: reservation.days_overdue,
      status: reservation.status
    })
  end
  
  def self.publish_reservation_extended(reservation, old_due_date)
    publish_event('reservation.extended', {
      reservationId: reservation.id,
      userId: reservation.user_id,
      bookId: reservation.book_id,
      oldDueDate: old_due_date.iso8601,
      newDueDate: reservation.due_date.iso8601,
      status: reservation.status
    })
  end
end

# Ensure proper cleanup on application shutdown
at_exit do
  EventService.instance.disconnect if defined?(EventService)
end 