<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Nightly: srcset thumbnails + AVIF variants for anything uploaded since the last run.
Schedule::command('images:optimize --keep --avif')->dailyAt('03:00')->withoutOverlapping();
