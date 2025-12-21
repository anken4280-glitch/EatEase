<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => ['*'], // Allow all for now
    
    'allowed_origins_patterns' => [
        '/localhost:[0-9]+/',
        '/127\.0\.0\.1:[0-9]+/',
        '/\.test$/',
    ],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,
];