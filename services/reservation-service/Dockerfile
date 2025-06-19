# syntax=docker/dockerfile:1
# check=error=true

# This Dockerfile is designed for production, not development. Use with Kamal or build'n'run by hand:
# docker build -t reservation_service .
# docker run -d -p 80:80 -e RAILS_MASTER_KEY=<value from config/master.key> --name reservation_service reservation_service

# For a containerized dev environment, see Dev Containers: https://guides.rubyonrails.org/getting_started_with_devcontainer.html

# Use Ruby 3.3.8 Alpine image
FROM ruby:3.3.8-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    sqlite-dev \
    postgresql-dev \
    tzdata \
    curl \
    bash

# Copy Gemfile and Gemfile.lock
COPY Gemfile Gemfile.lock ./

# Install Ruby dependencies
RUN bundle config --global frozen 1 && \
    bundle install --without development test

# Copy application code
COPY . .

# Create storage directory for SQLite
RUN mkdir -p storage

# Set environment variables
ENV RAILS_ENV=production
ENV RAILS_SERVE_STATIC_FILES=true
ENV RAILS_LOG_TO_STDOUT=true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Create non-root user
RUN addgroup -g 1001 -S rails && \
    adduser -S rails -u 1001 -G rails

# Change ownership of app directory
RUN chown -R rails:rails /app

# Switch to non-root user
USER rails

# Start the Rails server
CMD ["rails", "server", "-b", "0.0.0.0", "-p", "3000"]
