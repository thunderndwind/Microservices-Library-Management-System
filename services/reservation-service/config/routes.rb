Rails.application.routes.draw do
  # Health check endpoint
  get '/health', to: 'api/v1/reservations#health'
  
  namespace :api do
    namespace :v1 do
      # Reservation routes
      resources :reservations, except: [:edit, :new] do
        member do
          put :return, to: 'reservations#return_book'
          put :extend, to: 'reservations#extend_due_date'
        end
        
        collection do
          get :overdue
          get :status
          get 'user/:userId', to: 'reservations#user_reservations', as: :user_reservations
        end
      end
    end
  end
  
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
