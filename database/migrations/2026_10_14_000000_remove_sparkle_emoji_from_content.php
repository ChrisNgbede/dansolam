<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The sparkles emoji is no longer used anywhere in the store. The announcement
 * bar's free-delivery line gets a delivery van instead; elsewhere it is dropped.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('ecommerce_settings')->where('value', 'like', '%✨%')->orderBy('id')->each(function ($row) {
            $value = str_replace('✨ Free delivery', '🚚 Free delivery', $row->value);
            $value = trim(preg_replace('/ {2,}/u', ' ', str_replace('✨', '', $value)));
            DB::table('ecommerce_settings')->where('id', $row->id)->update(['value' => $value]);
        });

        DB::table('newsletter_campaigns')->where('subject', 'like', '%✨%')->orderBy('id')->each(function ($row) {
            DB::table('newsletter_campaigns')->where('id', $row->id)->update([
                'subject' => trim(preg_replace('/ {2,}/u', ' ', str_replace('✨', '', $row->subject))),
            ]);
        });
    }

    public function down(): void
    {
        // Content change only; nothing to restore.
    }
};
