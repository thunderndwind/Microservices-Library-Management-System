# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_06_15_205936) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "reservations", id: :string, force: :cascade do |t|
    t.string "user_id", null: false
    t.string "book_id", null: false
    t.datetime "reserved_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "due_date", null: false
    t.datetime "returned_at"
    t.string "status", default: "active", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["book_id", "status"], name: "index_reservations_on_book_id_and_status"
    t.index ["book_id"], name: "index_reservations_on_book_id"
    t.index ["due_date"], name: "index_reservations_on_due_date"
    t.index ["status"], name: "index_reservations_on_status"
    t.index ["user_id", "status"], name: "index_reservations_on_user_id_and_status"
    t.index ["user_id"], name: "index_reservations_on_user_id"
  end
end
