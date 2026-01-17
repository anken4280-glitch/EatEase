<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // LOGIN METHOD
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // 🔴 ADD THIS: Check if user is using correct app
        $appType = $request->header('X-Requested-App');

        // If diner app is used by non-diner
        if ($appType === 'diner-app' && $user->user_type !== 'diner') {
            return response()->json([
                'error' => 'wrong_app',
                'message' => 'This is the Diner App. Please use the Business App for restaurant management.',
                'redirect_url' => 'http://localhost:5177'
            ], 403);
        }

        // If business app is used by diner (we'll add this later)
        if ($appType === 'restaurant-app' && $user->user_type === 'diner') {
            return response()->json([
                'error' => 'wrong_app',
                'message' => 'This is the Business App. Please use the Diner App for browsing restaurants.',
                'redirect_url' => 'http://localhost:5176'
            ], 403);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'is_admin' => $user->is_admin,
                'created_at' => $user->created_at,
            ],
            'token' => $user->createToken('eatease-token')->plainTextToken,
        ]);
    }

    //SIGNUP METHOD
    public function signup(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6|confirmed',
            'user_type' => 'sometimes|string|in:diner' // Now works with string
        ]);

        // Force diner type for all signups (safer)
        $userType = 'diner';

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'user_type' => $request->user_type,
            'is_admin' => false,
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type, // ← INCLUDED
                'is_admin' => $user->is_admin,
            ],
            'token' => $user->createToken('eatease-token')->plainTextToken
        ]);
    }
}
