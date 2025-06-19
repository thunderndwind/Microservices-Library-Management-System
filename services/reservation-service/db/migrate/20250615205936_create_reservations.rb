class CreateReservations < ActiveRecord::Migration[8.0]
  def change
    create_table :reservations, id: false do |t|
      t.string :id, primary_key: true, null: false
      t.string :user_id, null: false
      t.string :book_id, null: false
      t.datetime :reserved_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.datetime :due_date, null: false
      t.datetime :returned_at, null: true
      t.string :status, null: false, default: 'active'

      t.timestamps
    end

    # Add indexes for better query performance
    add_index :reservations, :user_id
    add_index :reservations, :book_id
    add_index :reservations, :status
    add_index :reservations, :due_date
    add_index :reservations, [:user_id, :status]
    add_index :reservations, [:book_id, :status]
  end
end
