<?php

namespace App\Jobs;

use App\Models\Restaurant;
use App\Models\UserNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\DB; // Add this

class CheckNotificationPreferences implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $restaurant; // Change from protected to public

    public function __construct(Restaurant $restaurant)
    {
        $this->restaurant = $restaurant;
    }

    public function handle()
    {
        try {
            Log::info('Starting notification check for restaurant: ' . $this->restaurant->id);
            
            // Use DB transaction for safety
            DB::beginTransaction();
            
            // Find users who want notifications for this restaurant at current status
            $preferences = UserNotification::with('user')
                ->where('restaurant_id', $this->restaurant->id)
                ->where('notify_when_status', $this->restaurant->crowd_status)
                ->where('is_active', true)
                ->get();

            Log::info('Found ' . $preferences->count() . ' preferences to check');
            
            $createdCount = 0;
            foreach ($preferences as $preference) {
                // Check if notification already sent recently (last 6 hours)
                $recentNotification = NotificationLog::where('user_id', $preference->user_id)
                    ->where('restaurant_id', $this->restaurant->id)
                    ->where('status', $this->restaurant->crowd_status)
                    ->where('sent_at', '>=', now()->subHours(6))
                    ->exists();

                if (!$recentNotification) {
                    // Create notification
                    NotificationLog::create([
                        'user_id' => $preference->user_id,
                        'restaurant_id' => $this->restaurant->id,
                        'notification_type' => 'crowd_alert',
                        'title' => "Crowd Alert: {$this->restaurant->name}",
                        'message' => "{$this->restaurant->name} has reached {$this->getCrowdLevelText($this->restaurant->crowd_status)} crowd level",
                        'status' => $this->restaurant->crowd_status,
                        'is_read' => false,
                        'sent_at' => now(),
                    ]);
                    
                    $createdCount++;
                    Log::info("Notification created for user {$preference->user_id} about {$this->restaurant->name}");
                }
            }
            
            DB::commit();
            Log::info("Created {$createdCount} notifications for restaurant {$this->restaurant->id}");
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Notification check failed: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
        }
    }
    
    private function getCrowdLevelText($status)
    {
        switch ($status) {
            case 'green': return 'Low';
            case 'yellow': return 'Moderate';
            case 'orange': return 'Busy';
            case 'red': return 'Full';
            default: return $status;
        }
    }
}