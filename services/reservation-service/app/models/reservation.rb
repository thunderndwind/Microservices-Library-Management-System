class Reservation < ApplicationRecord
  # Generate UUID for primary key
  before_create :generate_uuid
  
  # Validations
  validates :user_id, presence: true
  validates :book_id, presence: true
  validates :reserved_at, presence: true
  validates :due_date, presence: true
  validates :status, presence: true, inclusion: { in: %w[active returned overdue] }
  
  # Custom validations
  validate :due_date_after_reserved_at
  validate :returned_at_after_reserved_at, if: :returned_at?
  
  # Scopes
  scope :active, -> { where(status: 'active') }
  scope :returned, -> { where(status: 'returned') }
  scope :overdue, -> { where(status: 'overdue') }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_book, ->(book_id) { where(book_id: book_id) }
  scope :due_soon, ->(days = 1) { where(due_date: Time.current..days.days.from_now) }
  scope :past_due, -> { where('due_date < ? AND status = ?', Time.current, 'active') }
  
  # Callbacks
  before_save :set_reserved_at, if: :new_record?
  before_save :update_overdue_status
  
  # Instance methods
  def overdue?
    status == 'overdue' || (active? && due_date < Time.current)
  end
  
  def active?
    status == 'active'
  end
  
  def returned?
    status == 'returned'
  end
  
  def days_until_due
    return 0 if returned? || due_date < Time.current
    (due_date.to_date - Date.current).to_i
  end
  
  def days_overdue
    return 0 unless overdue?
    return 0 if due_date >= Time.current
    (Date.current - due_date.to_date).to_i
  end
  
  def return_book!
    update!(
      status: 'returned',
      returned_at: Time.current
    )
  end
  
  def extend_due_date!(new_due_date)
    return false if returned?
    return false if new_due_date <= due_date
    
    update!(due_date: new_due_date)
  end
  
  def mark_overdue!
    update!(status: 'overdue') if active? && due_date < Time.current
  end
  
  # Class methods
  def self.mark_overdue_reservations!
    past_due.update_all(status: 'overdue')
  end
  
  def self.user_reservation_count(user_id)
    active.where(user_id: user_id).count
  end
  
  def self.book_reservation_count(book_id)
    active.where(book_id: book_id).count
  end
  
  private
  
  def generate_uuid
    self.id = SecureRandom.uuid if id.blank?
  end
  
  def due_date_after_reserved_at
    return unless reserved_at && due_date
    
    if due_date <= reserved_at
      errors.add(:due_date, 'must be after reservation date')
    end
  end
  
  def returned_at_after_reserved_at
    return unless reserved_at && returned_at
    
    if returned_at < reserved_at
      errors.add(:returned_at, 'must be after reservation date')
    end
  end
  
  def set_reserved_at
    self.reserved_at ||= Time.current
  end
  
  def update_overdue_status
    if active? && due_date < Time.current
      self.status = 'overdue'
    end
  end
end
