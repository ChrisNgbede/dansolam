<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ImageOptimizer
{
    /**
     * Resize, strip metadata and encode an uploaded image as WebP.
     */
    public function store(UploadedFile $file, string $directory = 'uploads', int $maxDimension = 2400, int $quality = 82): string
    {
        $directory = trim($directory, '/');
        $relativePath = $directory . '/' . Str::uuid() . '.webp';
        $disk = Storage::disk('public');
        $disk->makeDirectory($directory);
        $destination = $disk->path($relativePath);

        if (extension_loaded('imagick')) {
            $this->storeWithImagick($file->getRealPath(), $destination, $maxDimension, $quality);
        } elseif (extension_loaded('gd')) {
            $this->storeWithGd($file->getRealPath(), $destination, $maxDimension, $quality);
        } else {
            throw new RuntimeException('No supported server image processor is available.');
        }

        $this->makeThumbnail($destination);

        return $relativePath;
    }

    /**
     * Width of the small variant written next to every stored image as "<name>-480.webp".
     * The storefront offers it via srcset so product cards never download the full image.
     */
    public const THUMB_WIDTH = 480;

    public static function thumbnailPath(string $path): string
    {
        return preg_replace('/\.webp$/i', '-' . self::THUMB_WIDTH . '.webp', $path);
    }

    /**
     * Write the small variant for a stored WebP. Returns false if it could not be made.
     */
    public function makeThumbnail(string $absolutePath, int $quality = 76): bool
    {
        if (!function_exists('imagewebp') || !preg_match('/\.webp$/i', $absolutePath)) {
            return false;
        }

        $contents = @file_get_contents($absolutePath);
        $image = $contents !== false ? @imagecreatefromstring($contents) : false;
        if (!$image) {
            return false;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $targetWidth = min($width, self::THUMB_WIDTH);
        $targetHeight = max(1, (int) round($height * $targetWidth / $width));

        $thumb = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($thumb, false);
        imagesavealpha($thumb, true);
        imagecopyresampled($thumb, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        $ok = imagewebp($thumb, self::thumbnailPath($absolutePath), $quality);
        imagedestroy($thumb);
        imagedestroy($image);

        return $ok;
    }

    private function storeWithImagick(string $source, string $destination, int $maxDimension, int $quality): void
    {
        $image = new \Imagick($source);
        $image->setIteratorIndex(0);
        $image->autoOrient();

        if ($image->getImageWidth() > $maxDimension || $image->getImageHeight() > $maxDimension) {
            $image->thumbnailImage($maxDimension, $maxDimension, true, true);
        }

        $image->stripImage();
        $image->setImageFormat('webp');
        $image->setImageCompression(\Imagick::COMPRESSION_WEBP);
        $image->setImageCompressionQuality($quality);
        $image->setOption('webp:method', '6');
        $image->writeImage($destination);
        $image->clear();
        $image->destroy();
    }

    private function storeWithGd(string $source, string $destination, int $maxDimension, int $quality): void
    {
        $contents = file_get_contents($source);
        $original = $contents !== false ? imagecreatefromstring($contents) : false;
        if (!$original) {
            throw new RuntimeException('The uploaded image could not be processed.');
        }

        $width = imagesx($original);
        $height = imagesy($original);
        $scale = min(1, $maxDimension / max($width, $height));
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));
        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        imagecopyresampled($canvas, $original, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        if (!imagewebp($canvas, $destination, $quality)) {
            imagedestroy($canvas);
            imagedestroy($original);
            throw new RuntimeException('The optimized image could not be saved.');
        }

        imagedestroy($canvas);
        imagedestroy($original);
    }
}
