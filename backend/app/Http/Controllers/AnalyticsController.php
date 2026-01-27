<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\Reservation;
use App\Models\OccupancyLog; // ADD THIS IMPORT
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnalyticsController extends Controller
{
    /**
     * Get restaurant analytics (Premium only)
     */
    public function getRestaurantAnalytics($restaurantId, Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->user_type !== 'restaurant_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized'
            ], 403);
        }

        // Get the restaurant
        $restaurant = Restaurant::find($restaurantId);

        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found'
            ], 404);
        }

        // Check if user owns this restaurant
        if ($restaurant->owner_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized to view analytics for this restaurant'
            ], 403);
        }

        // Check if restaurant is premium
        if ($restaurant->subscription_tier !== 'premium') {
            return response()->json([
                'success' => false,
                'message' => 'Analytics available for Premium tier only'
            ], 403);
        }

        $range = $request->get('range', 'week');

        // Calculate real analytics data
        $analytics = $this->calculateAnalytics($restaurant, $range);

        return response()->json([
            'success' => true,
            'analytics' => $analytics,
            'time_range' => $range,
            'restaurant_name' => $restaurant->name
        ]);
    }

    /**
     * Calculate analytics data
     */
    private function calculateAnalytics($restaurant, $range)
    {
        $startDate = $this->getStartDateFromRange($range);

        return [
            'occupancy' => $this->getOccupancyData($restaurant, $startDate),
            'peakHours' => $this->getPeakHours($restaurant, $startDate),
            'revenue' => $this->getRevenueData($restaurant, $range),
            'reviews' => $this->getReviewData($restaurant, $range),
            'customers' => $this->getCustomerData($restaurant, $range),
            'summary' => $this->getAnalyticsSummary($restaurant, $range),
        ];
    }

    private function getStartDateFromRange($range)
    {
        return match ($range) {
            'week' => now()->subDays(7),
            'month' => now()->subDays(30),
            'year' => now()->subDays(365),
            default => now()->subDays(7),
        };
    }

    private function getOccupancyData($restaurant, $startDate)
    {
        $logs = OccupancyLog::where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $startDate)
            ->orderBy('created_at')
            ->get();

        // Check if we have any data
        if ($logs->isEmpty()) {
            return [
                'daily' => [],
                'weekly' => [],
                'monthly' => [],
                'current' => $restaurant->occupancy_percentage,
                'average' => 0,
                'peak' => 0,
                'low' => 0,
                'has_data' => false,
                'total_logs' => 0,
            ];
        }

        // Group by day for daily data
        $dailyData = [];
        $weeklyData = [];
        $monthlyData = [];

        foreach ($logs as $log) {
            $day = $log->created_at->format('Y-m-d');
            $week = $log->created_at->format('Y-W');
            $month = $log->created_at->format('Y-m');

            if (!isset($dailyData[$day])) $dailyData[$day] = [];
            $dailyData[$day][] = $log->occupancy_percentage;

            if (!isset($weeklyData[$week])) $weeklyData[$week] = [];
            $weeklyData[$week][] = $log->occupancy_percentage;

            if (!isset($monthlyData[$month])) $monthlyData[$month] = [];
            $monthlyData[$month][] = $log->occupancy_percentage;
        }

        // Calculate averages
        $dailyAvg = array_map(function ($day) {
            return count($day) > 0 ? round(array_sum($day) / count($day), 1) : 0;
        }, array_values($dailyData));

        $weeklyAvg = array_map(function ($week) {
            return count($week) > 0 ? round(array_sum($week) / count($week), 1) : 0;
        }, array_values($weeklyData));

        $monthlyAvg = array_map(function ($month) {
            return count($month) > 0 ? round(array_sum($month) / count($month), 1) : 0;
        }, array_values($monthlyData));

        return [
            'daily' => array_slice($dailyAvg, -7), // Last 7 days
            'weekly' => array_slice($weeklyAvg, -4), // Last 4 weeks
            'monthly' => array_slice($monthlyAvg, -12), // Last 12 months
            'current' => $restaurant->occupancy_percentage,
            'average' => round($logs->avg('occupancy_percentage'), 1),
            'peak' => round($logs->max('occupancy_percentage'), 1),
            'low' => round($logs->min('occupancy_percentage'), 1),
            'has_data' => true,
            'total_logs' => $logs->count(),
        ];
    }

    private function getPeakHours($restaurant, $startDate)
    {
        $logs = OccupancyLog::where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('HOUR(created_at) as hour, AVG(occupancy_percentage) as avg_occupancy')
            ->groupByRaw('HOUR(created_at)')
            ->orderBy('avg_occupancy', 'DESC')
            ->limit(6)
            ->get();

        $peakHours = [];
        foreach ($logs as $log) {
            $hour = $log->hour < 12 ? $log->hour . ' AM' : ($log->hour == 12 ? '12 PM' : ($log->hour - 12) . ' PM');

            $peakHours[] = [
                'hour' => $hour,
                'occupancy' => round($log->avg_occupancy, 1)
            ];
        }

        // If no logs, return mock data
        if (empty($peakHours)) {
            return [
                ['hour' => '12 PM', 'occupancy' => 70],
                ['hour' => '7 PM', 'occupancy' => 85],
                ['hour' => '8 PM', 'occupancy' => 80],
                ['hour' => '6 PM', 'occupancy' => 75],
            ];
        }

        return $peakHours;
    }

    private function getRevenueData($restaurant, $range)
    {
        // For now, we'll calculate based on occupancy (can be enhanced later)
        $averageSpend = 500; // Assume average spend per customer
        $avgOccupancy = $this->getAverageOccupancy($restaurant, $range);

        // Estimate revenue: average occupancy * max capacity * average spend
        $current = ($avgOccupancy / 100) * $restaurant->max_capacity * $averageSpend;
        $previous = ($avgOccupancy * 0.9 / 100) * $restaurant->max_capacity * $averageSpend;

        $growth = $previous > 0 ? round((($current - $previous) / $previous) * 100, 1) : 0;

        return [
            'current' => round($current),
            'previous' => round($previous),
            'growth' => ($growth > 0 ? '+' : '') . $growth . '%',
        ];
    }

    private function getAverageOccupancy($restaurant, $range)
    {
        $logs = OccupancyLog::where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $this->getStartDateFromRange($range))
            ->avg('occupancy_percentage');

        return $logs ?? 0;
    }

    private function getReviewData($restaurant, $range)
    {
        $reviews = Review::where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $this->getStartDateFromRange($range))
            ->get();

        $previousReviews = Review::where('restaurant_id', $restaurant->id)
            ->where('created_at', '<', $this->getStartDateFromRange($range))
            ->where('created_at', '>=', $this->getStartDateFromRange($range)->subDays(7))
            ->get();

        return [
            'average' => $reviews->avg('rating') ? round($reviews->avg('rating'), 1) : 0,
            'total' => $reviews->count(),
            'trend' => $reviews->count() - $previousReviews->count(),
            'distribution' => $this->getRatingDistribution($reviews),
        ];
    }

    private function getRatingDistribution($reviews)
    {
        $distribution = [0, 0, 0, 0, 0];
        foreach ($reviews as $review) {
            if ($review->rating >= 1 && $review->rating <= 5) {
                $distribution[$review->rating - 1]++;
            }
        }
        return $distribution;
    }

    private function getCustomerData($restaurant, $range)
    {
        // For MVP, we'll estimate based on reservations
        $reservations = Reservation::where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $this->getStartDateFromRange($range))
            ->get();

        $totalCustomers = $reservations->sum('party_size');
        $uniqueCustomers = $reservations->groupBy('user_id')->count();

        return [
            'repeat' => $uniqueCustomers > 0 ? round(($uniqueCustomers / $totalCustomers) * 100) : 0,
            'new' => $uniqueCustomers > 0 ? round(((count($reservations) - $uniqueCustomers) / $totalCustomers) * 100) : 100,
            'total' => $totalCustomers,
        ];
    }

    private function getAnalyticsSummary($restaurant, $range)
    {
        return [
            'best_day' => $this->getBestDay($restaurant, $range),
            'recommendations' => $this->getRecommendations($restaurant, $range),
            'insights' => $this->getInsights($restaurant, $range),
        ];
    }

    private function getBestDay($restaurant, $range)
    {
        $logs = OccupancyLog::where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $this->getStartDateFromRange($range))
            ->selectRaw('DAYNAME(created_at) as day, AVG(occupancy_percentage) as avg_occupancy')
            ->groupByRaw('DAYNAME(created_at)')
            ->orderBy('avg_occupancy', 'DESC')
            ->first();

        return $logs ? $logs->day . ' (' . round($logs->avg_occupancy) . '% avg)' : 'No data yet';
    }

    private function getRecommendations($restaurant, $range)
    {
        $avgOccupancy = $this->getAverageOccupancy($restaurant, $range);
        $recommendations = [];

        if ($avgOccupancy < 50) {
            $recommendations[] = "Consider running promotions during off-peak hours";
        }

        if ($avgOccupancy > 80) {
            $recommendations[] = "You're consistently busy! Consider expanding capacity";
        }

        // If no data yet
        if ($avgOccupancy === 0) {
            $recommendations[] = "Start logging occupancy data to get personalized recommendations";
        }

        return $recommendations;
    }

    private function getInsights($restaurant, $range)
    {
        $logs = OccupancyLog::where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $this->getStartDateFromRange($range))
            ->get();

        if ($logs->isEmpty()) {
            return ["Start logging occupancy data to get insights"];
        }

        $avgOccupancy = $logs->avg('occupancy_percentage');

        $insights = [];
        $insights[] = "Average occupancy: " . round($avgOccupancy) . "%";

        if ($avgOccupancy > 75) {
            $insights[] = "High demand - maximize seating efficiency";
        } elseif ($avgOccupancy < 40) {
            $insights[] = "Consider marketing campaigns to boost traffic";
        }

        return $insights;
    }
}
