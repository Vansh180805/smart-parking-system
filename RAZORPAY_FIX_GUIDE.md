# Razorpay Payment Gateway - Fix Guide

## Issues Fixed ✅

1. **Hardcoded Credentials Removed** - Credentials are now loaded from `.env` file instead of being hardcoded in the source code
2. **Environment Variable Configuration** - Both KEY_ID and KEY_SECRET now use `process.env` variables
3. **Security Validation** - Added checks to ensure credentials are properly configured
4. **Error Handling** - Improved error handling for missing Razorpay configuration

## What You Need to Do

### Step 1: Get Valid Razorpay Credentials

The current credentials in `.env` appear to be test credentials that may be expired or invalid:
```
RAZORPAY_KEY_ID=rzp_test_SXMZCJD9aUWuMn
RAZORPAY_KEY_SECRET=NeCTrQGKxzsHvC62GZ2zhzlI
```

**To get your own credentials:**

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com) and sign in
2. Navigate to **Settings → API Keys**
3. You'll see two tabs: **Test Keys** and **Live Keys**
4. Copy your **Test Key ID** and **Test Key Secret**
5. For production, use **Live Keys** instead

### Step 2: Update Your `.env` File

Replace the credentials with yours:
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_actual_key_secret_here
```

### Step 3: Restart Your Backend Server

```bash
npm start
# or if using nodemon
npm run dev
```

You should see this in the console:
```
✅ Razorpay initialized with KEY_ID: rzp_test_XXXXXXXXXXXXX...
```

## Common Issues & Solutions

### Issue: "500 Internal Server Error" from Razorpay

**Possible Causes:**
- Credentials are invalid or expired
- Credentials belong to a different account
- Razorpay account is not verified

**Solution:**
- Verify credentials are correct in `.env`
- Check Razorpay dashboard for account status
- Ensure you're using TEST keys for development

### Issue: "Refused to get unsafe header" Errors

**These are browser warnings** about Razorpay's API headers. They don't block functionality but indicate:
- The Razorpay SDK is making secure API calls
- Browser policy warnings (not critical errors)

### Issue: "Permissions policy violation: accelerometer"

**This is a browser feature policy warning**, not a payment error. It happens because:
- Razorpay's CDN has certain browser API permissions
- This doesn't affect payments

## Files Modified

✅ **paymentController.js**
- Removed hardcoded credentials
- Now uses `process.env.RAZORPAY_KEY_ID` and `process.env.RAZORPAY_KEY_SECRET`
- Added validation checks for missing credentials
- Improved error logging

## Testing the Integration

### Test Payment Flow:
1. Create a booking in your app
2. Click "Pay Now"
3. Use Razorpay test card: **4111 1111 1111 1111**
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
4. Click "Pay" to complete test payment

### Expected Console Logs:
```
✅ Razorpay initialized with KEY_ID: rzp_test_XXXXX...
📥 BOOKING ID: 507f1f77bcf86cd799439011
💰 ORDER OPTIONS: { amount: 50000, currency: 'INR', receipt: 'receipt_...' }
✅ ORDER CREATED: { id: 'order_XXXXX', ... }
```

## Next Steps

1. **Get Valid Credentials**: Sign up for Razorpay and get your test keys
2. **Update .env**: Replace with your credentials
3. **Test**: Run a test payment to verify
4. **Production**: When ready, switch to LIVE keys in `.env`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to Git
- Never share your KEY_SECRET publicly
- Always use TEST keys for development
- Rotate LIVE keys regularly in production
- Use different `.env` files for dev/staging/production

## Need More Help?

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- Check [server.js](smart-parking-system-backend/server.js) to ensure CORS is allowing payment requests
