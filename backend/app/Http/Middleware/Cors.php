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
        
        $allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174', 
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5176'
        ];
        
        // If origin is in allowed list, use it. Otherwise default to current port.
        $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : 'http://localhost:5173';

        $headers = [
            'Access-Control-Allow-Origin' => $allowedOrigin,
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-TOKEN',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age' => '86400',
        ];

        // Handle preflight requests
        if ($request->isMethod('OPTIONS')) {
            return response()->json('OK', 200, $headers);
        }

        $response = $next($request);
        
        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }
        
        return $response;
    }
}
