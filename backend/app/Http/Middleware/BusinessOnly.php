<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BusinessOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'error' => 'not_authenticated',
                'message' => 'Please log in to access this feature.'
            ], 401);
        }
        
        // Check user type - allow only restaurant_owner and admin
        if (!in_array($user->user_type, ['restaurant_owner', 'admin'])) {
            return response()->json([
                'error' => 'wrong_app',
                'message' => 'This is the Business App. Please use the Diner App for browsing restaurants.',
                'redirect_url' => 'http://localhost:5176'
            ], 403);
        }
        
        return $next($request);
    }
}
