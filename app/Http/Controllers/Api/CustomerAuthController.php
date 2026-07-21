<?php

namespace App\Http\Controllers\Api;

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

        $customer = Customer::where('email', $request->email)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password'
            ], 401);
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
        return response()->json([
            'success' => true,
            'data' => $request->user()
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
        $addresses = CustomerAddress::where('customer_id', $request->user()->id)->get();
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
     * Send password reset token.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:customers,email',
        ]);

        // Generate a 6-digit random code
        $token = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $token, 'created_at' => now()]
        );

        // Simulated delivery: Return the token in the API response in development
        return response()->json([
            'success' => true,
            'message' => 'A password reset token has been generated. Use the token to reset your password.',
            'debug_token' => $token // Returning the token so it can be verified directly without email setup
        ]);
    }

    /**
     * Reset password.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:customers,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $reset = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$reset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired password reset token'
            ], 400);
        }

        // Token is valid: update customer password
        $customer = Customer::where('email', $request->email)->first();
        if ($customer) {
            $customer->password = Hash::make($request->password);
            $customer->save();
        }

        // Clear the token
        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Your password has been successfully reset! You can now log in.'
        ]);
    }
}
