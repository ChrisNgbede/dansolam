<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. POS Sessions — tracks cash register open/close per user per day
        Schema::create('pos_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('ecommerce_id')->constrained()->onDelete('cascade');
            $table->string('register_name')->default('Main Register');
            $table->decimal('opening_cash', 15, 2)->default(0);
            $table->decimal('closing_cash', 15, 2)->nullable();
            $table->decimal('expected_cash', 15, 2)->default(0);
            $table->decimal('cash_sales_total', 15, 2)->default(0);
            $table->decimal('card_sales_total', 15, 2)->default(0);
            $table->decimal('transfer_sales_total', 15, 2)->default(0);
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->integer('total_transactions')->default(0);
            $table->integer('total_items_sold')->default(0);
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('open'); // open, closed
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['ecommerce_id', 'status']);
        });

        // 2. POS Transactions — each completed POS sale
        Schema::create('pos_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('pos_sessions')->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('ecommerce_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('transaction_number')->unique();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->string('discount_type')->nullable(); // percentage, fixed
            $table->string('discount_reason')->nullable();
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            $table->string('payment_status')->default('paid'); // paid, partial, refunded
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['session_id']);
            $table->index(['ecommerce_id', 'created_at']);
        });

        // 3. POS Transaction Payments — split payment records per transaction
        Schema::create('pos_transaction_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pos_transaction_id')->constrained('pos_transactions')->onDelete('cascade');
            $table->string('method'); // cash, card, transfer
            $table->decimal('amount', 15, 2);
            $table->string('reference')->nullable(); // for card/transfer
            $table->decimal('tendered', 15, 2)->nullable(); // for cash
            $table->decimal('change_due', 15, 2)->nullable(); // for cash
            $table->timestamps();
        });

        // 4. POS Held Carts — parked/held carts that can be resumed
        Schema::create('pos_held_carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('pos_sessions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('ecommerce_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('customer_name')->nullable();
            $table->text('note')->nullable();
            $table->string('status')->default('held'); // held, resumed, expired
            $table->timestamp('held_at')->useCurrent();
            $table->timestamp('resumed_at')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'status']);
        });

        // 5. POS Held Cart Items
        Schema::create('pos_held_cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pos_held_cart_id')->constrained('pos_held_carts')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->onDelete('set null');
            $table->string('product_name');
            $table->string('variant_label')->nullable();
            $table->decimal('price', 15, 2);
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        // 6. POS Cash Movements — cash-in/cash-out events during a session
        Schema::create('pos_cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('pos_sessions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // cash_in, cash_out
            $table->decimal('amount', 15, 2);
            $table->string('reason');
            $table->timestamps();

            $table->index(['session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_cash_movements');
        Schema::dropIfExists('pos_held_cart_items');
        Schema::dropIfExists('pos_held_carts');
        Schema::dropIfExists('pos_transaction_payments');
        Schema::dropIfExists('pos_transactions');
        Schema::dropIfExists('pos_sessions');
    }
};
