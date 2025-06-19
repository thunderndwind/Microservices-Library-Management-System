<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization will be handled by middleware
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'isbn' => 'nullable|string|size:13|regex:/^[0-9]{13}$/',
            'description' => 'nullable|string|max:2000',
            'quantity' => 'required|integer|min:1|max:1000',
        ];

        // For updates, make ISBN unique but ignore current record
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $bookId = $this->route('book');
            $rules['isbn'] = 'nullable|string|size:13|regex:/^[0-9]{13}$/|unique:books,isbn,' . $bookId;
        } else {
            // For creation, ISBN must be unique
            $rules['isbn'] = 'nullable|string|size:13|regex:/^[0-9]{13}$/|unique:books,isbn';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Book title is required',
            'title.max' => 'Book title cannot exceed 255 characters',
            'author.required' => 'Author name is required',
            'author.max' => 'Author name cannot exceed 255 characters',
            'isbn.size' => 'ISBN must be exactly 13 digits',
            'isbn.regex' => 'ISBN must contain only numbers',
            'isbn.unique' => 'A book with this ISBN already exists',
            'description.max' => 'Description cannot exceed 2000 characters',
            'quantity.required' => 'Quantity is required',
            'quantity.integer' => 'Quantity must be a number',
            'quantity.min' => 'Quantity must be at least 1',
            'quantity.max' => 'Quantity cannot exceed 1000',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => collect($validator->errors())->map(function ($errors, $field) {
                    return [
                        'field' => $field,
                        'message' => $errors[0] // Get first error message
                    ];
                })->values()->toArray()
            ], 422)
        );
    }
}