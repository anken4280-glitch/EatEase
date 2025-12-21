<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        // Allow ALL localhost ports for development
        $origin = $request->headers->get('Origin');
        
        // Dynamic origin matching for ANY localhost port
        $allowedOrigin = null;
        
        // Check if it's localhost or 127.0.0.1 with any port
        if (preg_match('/^http:\/\/(localhost|127\.0\.0\.1|localhost\.local):[0-9]+$/', $origin)) {
            $allowedOrigin = $origin;
        }
        
        // If no match, use a safe default
        if (!$allowedOrigin) {
            $allowedOrigin = 'http://localhost:5176';
        }
        
        // Set headers
        $headers = [
            'Access-Control-Allow-Origin' => $allowedOrigin,
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-TOKEN, X-XSRF-TOKEN, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age' => '86400', // 24 hours
            'Access-Control-Expose-Headers' => 'Authorization'
        ];
        
        // Handle OPTIONS (preflight) requests
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['method' => 'OPTIONS'], 200, $headers);
        }
        
        // For actual requests
        $response = $next($request);
        
        // Add headers to the response
        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }
        
        return $response;
    }
}