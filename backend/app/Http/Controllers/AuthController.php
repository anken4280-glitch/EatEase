<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // LOGIN METHOD - ENHANCED SECURITY
    public function login(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Find user
        $user = User::where('email', $request->email)->first();

        // SECURITY: Always return same error message to prevent user enumeration
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password'
            ], 401);
        }

        // Check if account is locked/suspended
        if ($user->is_suspended) {
            return response()->json([
                'success' => false,
                'message' => 'Account suspended. Please contact support.'
            ], 403);
        }

        // Track failed login attempts (optional - add to users table)
        // $user->update(['last_login_at' => now()]);

        // Create token with expiry
        $token = $user->createToken('eatease-token', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'is_admin' => $user->is_admin,
                'created_at' => $user->created_at,
            ],
            'token' => $token,
            'token_expires_at' => now()->addDays(7)->toISOString()
        ]);
    }

    // SIGNUP METHOD - ENHANCED SECURITY WITH STRONG PASSWORD VALIDATION
    public function signup(Request $request)
    {
        // Validate with industry-standard password rules
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8) // Minimum 8 characters
                    ->mixedCase()   // Must have uppercase and lowercase
                    ->numbers()     // Must include numbers
                    ->symbols()     // Must include symbols
                    ->uncompromised() // Check against breached passwords (requires guzzlehttp/guzzle)
            ],
            'user_type' => 'required|string|in:diner,restaurant_owner,admin'
        ], [
            'password' => 'Password must be at least 12 characters with uppercase, lowercase, numbers, and symbols.',
            'email.unique' => 'This email is already registered.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Additional security: Check if user_type matches the app they're signing up from
        $requestedApp = $request->header('X-Requested-App');
        
        if ($requestedApp === 'diner-app' && $request->user_type !== 'diner') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid user type for this application.'
            ], 422);
        }
        
        if ($requestedApp === 'restaurant-app' && $request->user_type !== 'restaurant_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid user type for this application.'
            ], 422);
        }

        // Check for common weak passwords manually
        $commonPasswords = [
            'password', 'password123', '123456', '12345678', 'qwerty',
            'abc123', 'letmein', 'monkey', 'admin', 'welcome', 'test123'
        ];
        
        if (in_array(strtolower($request->password), $commonPasswords)) {
            return response()->json([
                'success' => false,
                'errors' => [
                    'password' => ['This password is too common and easily guessed. Please choose a stronger password.']
                ]
            ], 422);
        }

        try {
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'user_type' => $request->user_type,
                'email_verified_at' => null, // For future email verification
            ]);

            // Email verification would go here in production
            // $user->sendEmailVerificationNotification();

            // Create token with expiry
            $token = $user->createToken('eatease-signup-token', ['*'], now()->addDays(7))->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Account created successfully!',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                    'is_admin' => $user->is_admin,
                ],
                'token' => $token,
                'token_expires_at' => now()->addDays(7)->toISOString()
            ], 201);

        } catch (\Exception $e) {
            Log::error('Signup error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.'
            ], 500);
        }
    }

    // LOGOUT METHOD
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed'
            ], 500);
        }
    }

    // GET CURRENT USER
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ]);
    }

    // CHANGE PASSWORD (For future implementation)
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => [
                'required',
                'confirmed',
                Password::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
            ]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        // Revoke all tokens except current one (optional)
        // $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }
}