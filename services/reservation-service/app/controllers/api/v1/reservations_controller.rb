class Api::V1::ReservationsController < ApplicationController
  before_action :authenticate_request, except: [:health, :status]
  before_action :set_reservation, only: [:show, :return_book, :extend_due_date]
  
  # GET /api/v1/reservations
  def index
    @reservations = Reservation.includes(:user, :book)
    
    # Filter by user_id if provided
    @reservations = @reservations.by_user(params[:userId]) if params[:userId].present?
    
    # Filter by status if provided
    @reservations = @reservations.where(status: params[:status]) if params[:status].present?
    
    # Filter by book_id if provided
    @reservations = @reservations.by_book(params[:bookId]) if params[:bookId].present?
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = [params[:limit]&.to_i || 10, 100].min
    
    @reservations = @reservations.page(page).per(per_page)
    
    render json: {
      success: true,
      message: 'Reservations retrieved successfully',
      data: {
        reservations: @reservations.map { |r| reservation_json(r) },
        pagination: {
          current_page: @reservations.current_page,
          total_pages: @reservations.total_pages,
          total_count: @reservations.total_count,
          per_page: per_page,
          has_next: @reservations.next_page.present?,
          has_prev: @reservations.prev_page.present?
        }
      }
    }
  rescue => e
    Rails.logger.error "Error retrieving reservations: #{e.message}"
    render json: {
      success: false,
      message: 'Failed to retrieve reservations'
    }, status: 500
  end
  
  # GET /api/v1/reservations/:id
  def show
    render json: {
      success: true,
      message: 'Reservation retrieved successfully',
      data: {
        reservation: reservation_json(@reservation)
      }
    }
  rescue => e
    Rails.logger.error "Error retrieving reservation: #{e.message}"
    render json: {
      success: false,
      message: 'Failed to retrieve reservation'
    }, status: 500
  end
  
  # POST /api/v1/reservations
  def create
    # Validate required parameters
    unless params[:userId] && params[:bookId]
      return render json: {
        success: false,
        message: 'User ID and Book ID are required'
      }, status: 400
    end
    
    # Check if user has reached maximum reservations
    user_reservations = Reservation.user_reservation_count(params[:userId])
    max_books = ENV.fetch('MAX_BOOKS_PER_USER', 5).to_i
    
    if user_reservations >= max_books
      return render json: {
        success: false,
        message: "Maximum #{max_books} active reservations allowed per user"
      }, status: 400
    end
    
    # Check if book is available
    unless book_available?(params[:bookId])
      return render json: {
        success: false,
        message: 'Book is not available for reservation'
      }, status: 400
    end
    
    # Calculate due date
    max_days = ENV.fetch('MAX_RESERVATION_DAYS', 14).to_i
    due_date = params[:dueDate]&.to_datetime || max_days.days.from_now
    
    # Ensure due date doesn't exceed maximum
    max_due_date = max_days.days.from_now
    due_date = [due_date, max_due_date].min
    
    @reservation = Reservation.new(
      user_id: params[:userId],
      book_id: params[:bookId],
      due_date: due_date,
      status: 'active'
    )
    
    if @reservation.save
      # Reserve the book in Book Service
      if reserve_book_in_service(@reservation.book_id)
        # Publish reservation created event
        publish_reservation_event('reservation.created', @reservation)
        
        render json: {
          success: true,
          message: 'Reservation created successfully',
          data: {
            reservation: reservation_json(@reservation)
          }
        }, status: 201
      else
        @reservation.destroy
        render json: {
          success: false,
          message: 'Failed to reserve book'
        }, status: 400
      end
    else
      render json: {
        success: false,
        message: 'Validation failed',
        errors: @reservation.errors.full_messages
      }, status: 400
    end
  rescue => e
    Rails.logger.error "Error creating reservation: #{e.message}"
    render json: {
      success: false,
      message: 'Failed to create reservation'
    }, status: 500
  end
  
  # PUT /api/v1/reservations/:id/return
  def return_book
    if @reservation.returned?
      return render json: {
        success: false,
        message: 'Book has already been returned'
      }, status: 400
    end
    
    if @reservation.return_book!
      # Return the book in Book Service
      return_book_in_service(@reservation.book_id)
      
      # Publish reservation returned event
      publish_reservation_event('reservation.returned', @reservation)
      
      render json: {
        success: true,
        message: 'Book returned successfully',
        data: {
          reservation: reservation_json(@reservation)
        }
      }
    else
      render json: {
        success: false,
        message: 'Failed to return book',
        errors: @reservation.errors.full_messages
      }, status: 400
    end
  rescue => e
    Rails.logger.error "Error returning book: #{e.message}"
    render json: {
      success: false,
      message: 'Failed to return book'
    }, status: 500
  end
  
  # PUT /api/v1/reservations/:id/extend
  def extend_due_date
    new_due_date = params[:newDueDate]&.to_datetime
    
    unless new_due_date
      return render json: {
        success: false,
        message: 'New due date is required'
      }, status: 400
    end
    
    # Check maximum extension limit
    max_days = ENV.fetch('MAX_RESERVATION_DAYS', 14).to_i
    max_due_date = @reservation.reserved_at + max_days.days
    
    if new_due_date > max_due_date
      return render json: {
        success: false,
        message: "Due date cannot exceed #{max_days} days from reservation date"
      }, status: 400
    end
    
    if @reservation.extend_due_date!(new_due_date)
      render json: {
        success: true,
        message: 'Due date extended successfully',
        data: {
          reservation: reservation_json(@reservation)
        }
      }
    else
      render json: {
        success: false,
        message: 'Failed to extend due date'
      }, status: 400
    end
  rescue => e
    Rails.logger.error "Error extending due date: #{e.message}"
    render json: {
      success: false,
      message: 'Failed to extend due date'
    }, status: 500
  end
  
  # GET /api/v1/reservations/user/:userId
  def user_reservations
    user_id = params[:userId]
    
    unless user_id
      return render json: {
        success: false,
        message: 'User ID is required'
      }, status: 400
    end
    
    @reservations = Reservation.by_user(user_id)
                              .includes(:user, :book)
                              .order(created_at: :desc)
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = [params[:limit]&.to_i || 10, 100].min
    
    @reservations = @reservations.page(page).per(per_page)
    
    render json: {
      success: true,
      message: 'User reservations retrieved successfully',
      data: {
        reservations: @reservations.map { |r| reservation_json(r) },
        pagination: {
          current_page: @reservations.current_page,
          total_pages: @reservations.total_pages,
          total_count: @reservations.total_count,
          per_page: per_page,
          has_next: @reservations.next_page.present?,
          has_prev: @reservations.prev_page.present?
        }
      }
    }
  rescue => e
    Rails.logger.error "Error retrieving user reservations: #{e.message}"
    render json: {
      success: false,
      message: 'Failed to retrieve user reservations'
    }, status: 500
  end
  
  # GET /api/v1/reservations/overdue
  def overdue
    @reservations = Reservation.overdue
                              .includes(:user, :book)
                              .order(:due_date)
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = [params[:limit]&.to_i || 10, 100].min
    
    @reservations = @reservations.page(page).per(per_page)
    
    render json: {
      success: true,
      message: 'Overdue reservations retrieved successfully',
      data: {
        reservations: @reservations.map { |r| reservation_json(r) },
        pagination: {
          current_page: @reservations.current_page,
          total_pages: @reservations.total_pages,
          total_count: @reservations.total_count,
          per_page: per_page,
          has_next: @reservations.next_page.present?,
          has_prev: @reservations.prev_page.present?
        }
      }
    }
  rescue => e
    Rails.logger.error "Error retrieving overdue reservations: #{e.message}"
    render json: {
      success: false,
      message: 'Failed to retrieve overdue reservations'
    }, status: 500
  end
  
  # GET /api/v1/reservations/status
  def status
    render json: {
      success: true,
      message: 'Reservation service is running',
      data: {
        timestamp: Time.current.iso8601,
        service: 'reservation-service',
        version: '1.0.0',
        database: 'postgresql',
        status: 'running'
      }
    }
  end
  
  # GET /api/v1/reservations/health
  def health
    begin
      # Initialize started_at if not already set
      started_at = Rails.application.config.x.started_at ||= Time.current
      uptime_seconds = (Time.current - started_at).to_f
      
      # Check database connection
      database_connected = false
      total_reservations = 0
      
      begin
        database_connected = ActiveRecord::Base.connection.active?
        total_reservations = Reservation.count if database_connected
      rescue => db_error
        Rails.logger.warn "Database health check failed: #{db_error.message}"
        database_connected = false
      end
      
      render json: {
        success: true,
        message: 'Reservation service is healthy',
        data: {
          timestamp: Time.current.iso8601,
          uptime: uptime_seconds.round(2),
          service: 'reservation-service',
          version: '1.0.0',
          database: 'postgresql',
          status: 'running',
          database_connected: database_connected,
          total_reservations: total_reservations,
          memory_usage: {
            rss: `ps -o rss= -p #{Process.pid}`.strip.to_i * 1024
          }
        }
      }
    rescue => e
      Rails.logger.error "Health check error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: {
        success: false,
        message: 'Service unhealthy',
        error: e.message
      }, status: 500
    end
  end
  
  private
  
  def set_reservation
    @reservation = Reservation.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'Reservation not found'
    }, status: 404
  end
  
  def reservation_json(reservation)
    {
      id: reservation.id,
      user_id: reservation.user_id,
      book_id: reservation.book_id,
      reserved_at: reservation.reserved_at.iso8601,
      due_date: reservation.due_date.iso8601,
      returned_at: reservation.returned_at&.iso8601,
      status: reservation.status,
      days_until_due: reservation.days_until_due,
      days_overdue: reservation.days_overdue,
      is_overdue: reservation.overdue?,
      created_at: reservation.created_at.iso8601,
      updated_at: reservation.updated_at.iso8601
    }
  end
  
  def book_available?(book_id)
    # Call Book Service to check availability
    response = HTTParty.get(
      "#{ENV.fetch('BOOK_SERVICE_URL', 'http://localhost:8000')}/api/v1/books/#{book_id}/availability",
      headers: {
        'X-Service-Token' => ENV.fetch('SERVICE_TOKEN', 'internal-service-token')
      }
    )
    
    return false unless response.success?
    
    data = JSON.parse(response.body)
    data.dig('data', 'is_available') == true
  rescue => e
    Rails.logger.error "Error checking book availability: #{e.message}"
    false
  end
  
  def reserve_book_in_service(book_id)
    # Call Book Service to reserve the book
    response = HTTParty.post(
      "#{ENV.fetch('BOOK_SERVICE_URL', 'http://localhost:8000')}/api/v1/internal/books/#{book_id}/reserve",
      headers: {
        'Content-Type' => 'application/json',
        'X-Service-Token' => ENV.fetch('SERVICE_TOKEN', 'internal-service-token')
      },
      body: { quantity: 1 }.to_json
    )
    
    response.success?
  rescue => e
    Rails.logger.error "Error reserving book: #{e.message}"
    false
  end
  
  def return_book_in_service(book_id)
    # Call Book Service to return the book
    response = HTTParty.post(
      "#{ENV.fetch('BOOK_SERVICE_URL', 'http://localhost:8000')}/api/v1/internal/books/#{book_id}/return",
      headers: {
        'Content-Type' => 'application/json',
        'X-Service-Token' => ENV.fetch('SERVICE_TOKEN', 'internal-service-token')
      },
      body: { quantity: 1 }.to_json
    )
    
    response.success?
  rescue => e
    Rails.logger.error "Error returning book: #{e.message}"
    false
  end
  
  def publish_reservation_event(event_type, reservation)
    # This will be implemented in the EventService
    EventService.publish_event(event_type, {
      reservationId: reservation.id,
      userId: reservation.user_id,
      bookId: reservation.book_id,
      dueDate: reservation.due_date.iso8601,
      returnDate: reservation.returned_at&.iso8601,
      status: reservation.status
    })
  rescue => e
    Rails.logger.error "Error publishing event: #{e.message}"
  end
end
