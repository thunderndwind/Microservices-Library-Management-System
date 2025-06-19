class ApplicationController < ActionController::API
  before_action :set_started_at
  
  private
  
  def set_started_at
    # Initialize application start time if not already set
    Rails.application.config.x.started_at ||= Time.current
  end
  
  def authenticate_request
    # Check for service token first (for internal service calls)
    service_token = request.headers['X-Service-Token']
    if service_token.present?
      return authenticate_service_token(service_token)
    end
    
    # Check for JWT token
    token = extract_token_from_header
    return render_unauthorized('Authorization token is required') unless token
    
    begin
      decoded_token = JWT.decode(token, jwt_secret, true, { algorithm: 'HS256' })
      @current_user_id = decoded_token[0]['userId'] || decoded_token[0]['user_id']
      
      # Validate user exists by calling User Service
      unless user_exists?(@current_user_id)
        return render_unauthorized('User not found')
      end
      
    rescue JWT::DecodeError => e
      render_unauthorized('Token is invalid')
    rescue JWT::ExpiredSignature => e
      render_unauthorized('Token has expired')
    rescue => e
      Rails.logger.error "Authentication error: #{e.message}"
      render_unauthorized('Authentication failed')
    end
  end
  
  def authenticate_service_token(token)
    expected_token = ENV.fetch('SERVICE_TOKEN', 'internal-service-token')
    
    unless token == expected_token
      return render_unauthorized('Invalid service token')
    end
    
    # Set a flag to indicate this is a service call
    @service_call = true
  end
  
  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header&.start_with?('Bearer ')
    
    auth_header.split(' ').last
  end
  
  def jwt_secret
    ENV.fetch('JWT_SECRET', 'your_jwt_secret_key_change_in_production')
  end
  
  def user_exists?(user_id)
    return true if @service_call # Skip validation for service calls
    
    # Call User Service to validate user exists
    response = HTTParty.get(
      "#{ENV.fetch('USER_SERVICE_URL', 'http://localhost:3001')}/api/v1/internal/users/#{user_id}",
      headers: {
        'X-Service-Token' => ENV.fetch('SERVICE_TOKEN', 'internal-service-token')
      }
    )
    
    response.success?
  rescue => e
    Rails.logger.error "Error validating user: #{e.message}"
    false
  end
  
  def render_unauthorized(message = 'Unauthorized')
    render json: {
      success: false,
      message: message
    }, status: 401
  end
  
  def render_forbidden(message = 'Forbidden')
    render json: {
      success: false,
      message: message
    }, status: 403
  end
  
  def render_not_found(message = 'Not found')
    render json: {
      success: false,
      message: message
    }, status: 404
  end
  
  def render_bad_request(message = 'Bad request')
    render json: {
      success: false,
      message: message
    }, status: 400
  end
  
  def render_server_error(message = 'Internal server error')
    render json: {
      success: false,
      message: message
    }, status: 500
  end
end
