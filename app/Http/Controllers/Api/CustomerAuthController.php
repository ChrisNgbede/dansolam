<?php

namespace App\Http\Controllers\Api;

use App\Mail\StoreMessage;
use App\Services\StoreMailer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CustomerAuthController extends Controller
{
    /**
     * Customer registration.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:customers,email|max:255',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        $token = $customer->createToken('customer_token')->plainTextToken;

        StoreMailer::send($customer->email, new StoreMessage(
            subjectLine: 'Welcome to Dansolam Beauty Home',
            heading: 'Welcome, ' . strtok(trim($customer->name), ' ') . '!',
            paragraphs: [
                'Thank you for creating your Dansolam account. You can now check out faster, track your orders and keep a wishlist of your favourites.',
                'Our skincare is made from natural, plant-based ingredients for a healthy, even glow. If you need help choosing products for your skin, just reply to this email.',
            ],
            buttonText: 'Start shopping',
            buttonUrl: url('/shop'),
        ));

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'customer' => $customer,
                'token' => $token,
            ]
        ], 201);
    }

    /**
     * Customer login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $customer = Customer::with('addresses')->where('email', $request->email)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password'
            ], 401);
        }

        // If customer has no addresses, try populating from their latest order
        if ($customer->addresses->isEmpty()) {
            $latestOrder = $customer->orders()
                ->whereNotNull('delivery_address')
                ->where('delivery_address', '!=', '')
                ->latest()
                ->first();

            if ($latestOrder) {
                CustomerAddress::create([
                    'customer_id' => $customer->id,
                    'address_line_1' => $latestOrder->delivery_address,
                    'city' => $latestOrder->delivery_city ?? '',
                    'state' => $latestOrder->delivery_state ?? '',
                    'country' => $latestOrder->delivery_country ?? '',
                    'is_default' => true,
                ]);
                $customer->load('addresses');
            }
        }

        $token = $customer->createToken('customer_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'customer' => $customer,
                'token' => $token,
            ]
        ]);
    }

    /**
     * Customer logout.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get profile details.
     */
    public function getProfile(Request $request)
    {
        $customer = $request->user()->load('addresses');
        if ($customer->addresses->isEmpty()) {
            $latestOrder = $customer->orders()
                ->whereNotNull('delivery_address')
                ->where('delivery_address', '!=', '')
                ->latest()
                ->first();

            if ($latestOrder) {
                CustomerAddress::create([
                    'customer_id' => $customer->id,
                    'address_line_1' => $latestOrder->delivery_address,
                    'city' => $latestOrder->delivery_city ?? '',
                    'state' => $latestOrder->delivery_state ?? '',
                    'country' => $latestOrder->delivery_country ?? '',
                    'is_default' => true,
                ]);
                $customer->load('addresses');
            }
        }

        return response()->json([
            'success' => true,
            'data' => $customer
        ]);
    }

    /**
     * Update profile details.
     */
    public function updateProfile(Request $request)
    {
        $customer = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'required|email|unique:customers,email,' . $customer->id,
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $customer->name = $request->name;
        $customer->phone = $request->phone;
        $customer->email = $request->email;

        if ($request->filled('password')) {
            $customer->password = Hash::make($request->password);
        }

        $customer->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $customer
        ]);
    }

    /**
     * Get customer orders history.
     */
    public function getOrders(Request $request)
    {
        $orders = Order::where('customer_id', $request->user()->id)
            ->with(['items'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Get addresses.
     */
    public function getAddresses(Request $request)
    {
        $customer = $request->user();
        $addresses = CustomerAddress::where('customer_id', $customer->id)->get();

        if ($addresses->isEmpty()) {
            $latestOrder = $customer->orders()
                ->whereNotNull('delivery_address')
                ->where('delivery_address', '!=', '')
                ->latest()
                ->first();

            if ($latestOrder) {
                $createdAddr = CustomerAddress::create([
                    'customer_id' => $customer->id,
                    'address_line_1' => $latestOrder->delivery_address,
                    'city' => $latestOrder->delivery_city ?? '',
                    'state' => $latestOrder->delivery_state ?? '',
                    'country' => $latestOrder->delivery_country ?? '',
                    'is_default' => true,
                ]);
                $addresses = collect([$createdAddr]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $addresses
        ]);
    }

    /**
     * Add address.
     */
    public function addAddress(Request $request)
    {
        $request->validate([
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'is_default' => 'boolean',
        ]);

        $customer = $request->user();

        // If this is set as default, remove default flag from others
        if ($request->is_default) {
            CustomerAddress::where('customer_id', $customer->id)->update(['is_default' => false]);
        }

        $address = CustomerAddress::create([
            'customer_id' => $customer->id,
            'address_line_1' => $request->address_line_1,
            'address_line_2' => $request->address_line_2,
            'city' => $request->city,
            'state' => $request->state,
            'country' => $request->country,
            'is_default' => $request->is_default ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Address added successfully',
            'data' => $address
        ], 201);
    }

    /**
     * Delete Address.
     */
    public function deleteAddress(Request $request, $id)
    {
        $address = CustomerAddress::where('customer_id', $request->user()->id)->find($id);

        if (!$address) {
            return response()->json(['success' => false, 'message' => 'Address not found'], 404);
        }

        $address->delete();
        return response()->json(['success' => true, 'message' => 'Address deleted successfully']);
    }

    /**
     * Retrieve wishlist.
     */
    public function getWishlist(Request $request)
    {
        $wishlist = $request->user()->wishlist()->with(['images', 'variants'])->get();
        return response()->json([
            'success' => true,
            'data' => $wishlist
        ]);
    }

    /**
     * Toggle wishlist item.
     */
    public function toggleWishlist(Request $request)
    {
        $request->validate(['product_id' => 'required|exists:products,id']);
        $customer = $request->user();
        
        $exists = $customer->wishlist()->where('product_id', $request->product_id)->exists();

        if ($exists) {
            $customer->wishlist()->detach($request->product_id);
            $status = 'removed';
        } else {
            $customer->wishlist()->attach($request->product_id);
            $status = 'added';
        }

        return response()->json([
            'success' => true,
            'message' => "Product successfully {$status} from wishlist",
            'status' => $status
        ]);
    }

    /**
     * Update customer measurements.
     */
    public function updateMeasurements(Request $request)
    {
        $request->validate([
            'bust' => 'nullable|string|max:50',
            'waist' => 'nullable|string|max:50',
            'hips' => 'nullable|string|max:50',
            'height' => 'nullable|string|max:50',
            'shoe_size' => 'nullable|string|max:50',
            'fit_preference' => 'nullable|string|max:100',
        ]);

        $customer = $request->user();
        $customer->update([
            'measurements' => [
                'bust' => $request->bust,
                'waist' => $request->waist,
                'hips' => $request->hips,
                'height' => $request->height,
                'shoe_size' => $request->shoe_size,
                'fit_preference' => $request->fit_preference,
            ]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your size measurements have been updated successfully!',
            'data' => $customer->measurements
        ]);
    }

    /**
     * Helper to configure dynamic SMTP settings for customer auth mailings.
     */
    private function configureSmtp(): array
    {
        $settingsRaw = \App\Models\EcommerceSetting::all();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        \App\Services\StoreMailer::use($settings, $settings['ecommerce_name'] ?? null);

        return $settings;
    }

    /**
     * Send password reset link & token (water-tight security with user-enumeration protection).
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $normalizedEmail = strtolower(trim($request->email));
        $customer = Customer::where('email', $normalizedEmail)->first();

        // Only generate token and send email if customer account actually exists
        if ($customer) {
            // Generate a 6-digit random code
            $token = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            \DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $normalizedEmail],
                ['token' => $token, 'created_at' => now()]
            );

            // Configure dynamic SMTP settings from database
            $settings = $this->configureSmtp();
            $storeName = $settings['ecommerce_name'] ?? 'Dansolam Beauty Home';
            $resetUrl = url('/reset-password?email=' . urlencode($normalizedEmail) . '&code=' . urlencode($token));

            StoreMailer::send($normalizedEmail, new StoreMessage(
                subjectLine: "Reset your password - {$storeName}",
                heading: 'Reset your password',
                paragraphs: [
                    'Hello ' . $customer->name . ', we received a request to reset the password for your account.',
                    'Click the button below to choose a new password, or enter this code on the reset page. The link and code expire in 60 minutes.',
                    'If you did not ask for this, you can ignore this email: your password will not change.',
                ],
                buttonText: 'Choose a new password',
                buttonUrl: $resetUrl,
                code: $token,
            ));
        }

        // Generic, safe response that prevents user enumeration
        return response()->json([
            'success' => true,
            'message' => 'If an account exists with that email address, password reset instructions have been sent.'
        ]);
    }

    /**
     * Reset password with token expiry validation and single-use invalidation.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $normalizedEmail = strtolower(trim($request->email));
        $submittedToken = trim($request->token);

        $reset = \DB::table('password_reset_tokens')
            ->where('email', $normalizedEmail)
            ->where('token', $submittedToken)
            ->first();

        if (!$reset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired password reset code. Please request a new one.'
            ], 400);
        }

        // Enforce 60-minute token expiration
        $createdAt = \Carbon\Carbon::parse($reset->created_at);
        if ($createdAt->addMinutes(60)->isPast()) {
            \DB::table('password_reset_tokens')->where('email', $normalizedEmail)->delete();
            return response()->json([
                'success' => false,
                'message' => 'This password reset code has expired. Please request a new one.'
            ], 400);
        }

        // Token is valid: update customer password
        $customer = Customer::where('email', $normalizedEmail)->first();
        if ($customer) {
            $customer->password = Hash::make($request->password);
            $customer->save();
        }

        // Invalidate token (single-use protection)
        \DB::table('password_reset_tokens')->where('email', $normalizedEmail)->delete();

        if ($customer) {
            StoreMailer::send($customer->email, new StoreMessage(
                subjectLine: 'Your Dansolam password was changed',
                heading: 'Your password was changed',
                paragraphs: [
                    'Hello ' . $customer->name . ', the password for your Dansolam account was just reset.',
                    'If this was you, there is nothing more to do. If it was not, please reset your password straight away and reply to this email so we can help secure your account.',
                ],
                details: ['Changed at' => now()->format('j M Y, H:i')],
                buttonText: 'Sign in',
                buttonUrl: url('/account'),
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Your password has been successfully reset! You can now log in with your new password.'
        ]);
    }
}
