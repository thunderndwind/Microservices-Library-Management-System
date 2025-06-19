class Rack::Attack
  # Configure cache store
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  
  # Rate limiting configuration
  throttle_limit = ENV.fetch('RATE_LIMIT_REQUESTS', 100).to_i
  throttle_period = ENV.fetch('RATE_LIMIT_PERIOD', 900).to_i # 15 minutes
  
  # General API rate limiting
  throttle('api/ip', limit: throttle_limit, period: throttle_period) do |req|
    req.ip if req.path.start_with?('/api/')
  end
  
  # More restrictive rate limiting for reservation creation
  throttle('reservations/ip', limit: 20, period: throttle_period) do |req|
    req.ip if req.path.start_with?('/api/v1/reservations') && req.post?
  end
  
  # Block requests with invalid tokens more aggressively
  throttle('invalid_token/ip', limit: 5, period: throttle_period) do |req|
    req.ip if req.env['HTTP_AUTHORIZATION'].present? && 
              !req.env['HTTP_AUTHORIZATION'].match?(/^Bearer\s+[\w\-\.]+$/)
  end
  
  # Custom response for throttled requests
  self.throttled_response = lambda do |env|
    [
      429,
      { 'Content-Type' => 'application/json' },
      [{ 
        success: false, 
        message: 'Rate limit exceeded. Please try again later.' 
      }.to_json]
    ]
  end
end

# Enable Rack::Attack
Rails.application.config.middleware.use Rack::Attack 