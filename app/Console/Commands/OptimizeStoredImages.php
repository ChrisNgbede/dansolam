<?php

namespace App\Console\Commands;

use App\Services\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/**
 * Converts legacy JPEG/PNG uploads on the public disk to resized WebP files
 * and rewrites every database reference to point at the new file.
 */
class OptimizeStoredImages extends Command
{
    protected $signature = 'images:optimize
        {--max=1600 : Longest edge in pixels}
        {--quality=78 : WebP quality (0-100)}
        {--keep : Keep the original files after conversion}
        {--avif : Also write .avif siblings (needs the avifenc binary) for AVIF-capable browsers}';

    protected $description = 'Convert legacy JPEG/PNG uploads to WebP, update database references and generate srcset thumbnails';

    public function handle(): int
    {
        if (!function_exists('imagewebp')) {
            $this->error('GD with WebP support is required.');
            return self::FAILURE;
        }

        $disk = Storage::disk('public');
        $converted = [];

        foreach ($disk->allFiles() as $relative) {
            if (!preg_match('/\.(jpe?g|png)$/i', $relative)) {
                continue;
            }

            $target = preg_replace('/\.(jpe?g|png)$/i', '.webp', $relative);
            if (!$disk->exists($target) && !$this->convert($disk->path($relative), $disk->path($target))) {
                $this->warn("Skipped {$relative}");
                continue;
            }

            $converted[$relative] = $target;
        }

        $this->info(count($converted) . ' image(s) converted.');
        $updated = $this->rewriteReferences($converted);
        $this->info("{$updated} database value(s) updated.");

        if (!$this->option('keep')) {
            $disk->delete(array_keys($converted));
        }

        // Small variants for srcset (skips files that already have one).
        $optimizer = app(ImageOptimizer::class);
        $thumbs = 0;
        foreach ($disk->allFiles() as $relative) {
            if (!preg_match('/\.webp$/i', $relative) || preg_match('/-' . ImageOptimizer::THUMB_WIDTH . '\.webp$/i', $relative)) {
                continue;
            }
            if (!$disk->exists(ImageOptimizer::thumbnailPath($relative)) && $optimizer->makeThumbnail($disk->path($relative))) {
                $thumbs++;
            }
        }
        $this->info("{$thumbs} thumbnail(s) generated.");

        if ($this->option('avif')) {
            $this->writeAvifSiblings([$disk->path(''), public_path('images')]);
        }

        return self::SUCCESS;
    }

    /**
     * The web server serves "<name>.avif" in place of "<name>.webp" when the browser
     * accepts AVIF (see public/.htaccess), so WebP remains the fallback.
     */
    private function writeAvifSiblings(array $roots): void
    {
        if (!Process::run(['which', 'avifenc'])->successful()) {
            $this->warn('avifenc not found; skipping AVIF generation.');
            return;
        }

        $written = 0;
        foreach ($roots as $root) {
            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS));
            foreach ($files as $file) {
                $webp = $file->getPathname();
                if (!preg_match('/\.webp$/i', $webp)) {
                    continue;
                }
                $avif = preg_replace('/\.webp$/i', '.avif', $webp);
                if (file_exists($avif)) {
                    continue;
                }
                // avifenc cannot read WebP, so decode to PNG first.
                $png = sys_get_temp_dir() . '/' . uniqid('avif', true) . '.png';
                $image = @imagecreatefromwebp($webp);
                if (!$image) {
                    continue;
                }
                imagesavealpha($image, true);
                imagepng($image, $png);
                imagedestroy($image);
                if (Process::run(['avifenc', '-q', '60', '-s', '6', $png, $avif])->successful()) {
                    // Only keep it when it actually beats the WebP.
                    if (filesize($avif) >= filesize($webp)) {
                        @unlink($avif);
                    } else {
                        $written++;
                    }
                }
                @unlink($png);
            }
        }
        $this->info("{$written} AVIF file(s) generated.");
    }

    private function convert(string $source, string $destination): bool
    {
        $contents = @file_get_contents($source);
        $image = $contents !== false ? @imagecreatefromstring($contents) : false;
        if (!$image) {
            return false;
        }

        $max = (int) $this->option('max');
        $width = imagesx($image);
        $height = imagesy($image);
        $scale = min(1, $max / max($width, $height));

        if ($scale < 1) {
            $resized = imagecreatetruecolor((int) round($width * $scale), (int) round($height * $scale));
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, imagesx($resized), imagesy($resized), $width, $height);
            imagedestroy($image);
            $image = $resized;
        } else {
            imagepalettetotruecolor($image);
            imagealphablending($image, false);
            imagesavealpha($image, true);
        }

        $ok = imagewebp($image, $destination, (int) $this->option('quality'));
        imagedestroy($image);

        return $ok;
    }

    /**
     * Replace old paths in every text-like column that mentions them.
     */
    private function rewriteReferences(array $converted): int
    {
        if (!$converted) {
            return 0;
        }

        $columns = DB::select(
            "SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND DATA_TYPE IN ('varchar','text','mediumtext','longtext','json')"
        );

        $total = 0;
        foreach ($columns as $column) {
            foreach ($converted as $old => $new) {
                $total += DB::table($column->t)
                    ->where($column->c, 'like', '%' . $old . '%')
                    ->update([$column->c => DB::raw('REPLACE(`' . $column->c . '`, ' . DB::getPdo()->quote($old) . ', ' . DB::getPdo()->quote($new) . ')')]);
            }
        }

        return $total;
    }
}
