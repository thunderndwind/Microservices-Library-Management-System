FactoryBot.define do
  factory :reservation do
    user_id { "" }
    book_id { "" }
    reserved_at { "2025-06-15 20:59:37" }
    due_date { "2025-06-15 20:59:37" }
    returned_at { "2025-06-15 20:59:37" }
    status { "MyString" }
  end
end
