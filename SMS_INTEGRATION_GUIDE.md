# SMS OTP Integration Guide for Helparo

## Current Status
✅ OTP system is working with console logging (development mode)
✅ Code is ready for real SMS integration
✅ Multiple SMS providers supported (MSG91, Twilio, Fast2SMS)

## To Enable Real SMS Messages:

### Option 1: MSG91 (Recommended for India) 🇮🇳

**Cost**: ~₹0.15 per SMS (bulk rates available)

1. **Sign up**: https://msg91.com/
2. **Get your credentials**:
   - Go to MSG91 Dashboard
   - Copy your **Auth Key**
   - Create SMS template and get **Template ID**
   - Get your **Sender ID** (e.g., HELPRO)

3. **Update `.env.local`**:
```env
SMS_PROVIDER=msg91
SMS_AUTH_KEY=your_actual_auth_key_here
SMS_SENDER_ID=HELPRO
SMS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_SMS_ENABLED=true
```

4. **Restart server**: `npm run dev`

### Option 2: Twilio (International)

**Cost**: ~$0.0075 per SMS

1. **Sign up**: https://www.twilio.com/
2. **Get credentials**:
   - Account SID
   - Auth Token
   - Twilio Phone Number

3. **Update `.env.local`**:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
NEXT_PUBLIC_SMS_ENABLED=true
```

### Option 3: Fast2SMS (India - Budget Option)

**Cost**: ~₹0.10 per SMS

1. **Sign up**: https://www.fast2sms.com/
2. **Get API Key** from dashboard

3. **Update `.env.local`**:
```env
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_api_key_here
NEXT_PUBLIC_SMS_ENABLED=true
```

## How It Works Now

### Development Mode (Current)
- `NEXT_PUBLIC_SMS_ENABLED=false` (default)
- OTP appears in browser console
- No SMS charges
- Perfect for testing

### Production Mode
- `NEXT_PUBLIC_SMS_ENABLED=true`
- Real SMS sent to user's phone
- OTP still logged to console as backup
- API keys kept secure on server side

## Testing the SMS Integration

1. **Keep it in Dev Mode first**: Test with console OTPs
2. **When ready for production**:
   - Sign up with MSG91/Twilio/Fast2SMS
   - Add credentials to `.env.local`
   - Set `NEXT_PUBLIC_SMS_ENABLED=true`
   - Test with your own phone number
   - Monitor SMS delivery in provider dashboard

## SMS Template Example (for MSG91)

```
Your Helparo verification code is ##OTP##. Valid for 5 minutes. Do not share this code with anyone.
```

## Cost Estimation

For 1000 users/month:
- **MSG91**: ₹150/month
- **Twilio**: ~₹600/month ($7.5)
- **Fast2SMS**: ₹100/month

## Important Notes

⚠️ **Never commit `.env.local` to Git** - It contains secret keys
✅ **Test thoroughly** before enabling in production
✅ **Monitor SMS delivery rates** in provider dashboard
✅ **Set up SMS credits/recharge** before going live
✅ **Comply with DND regulations** for Indian numbers

## Current Setup (No Changes Needed for Development)

Your site works perfectly now with console-based OTP. When you're ready for production:
1. Choose SMS provider
2. Add credentials to `.env.local`  
3. Change `NEXT_PUBLIC_SMS_ENABLED=true`
4. That's it! 🚀

## Support

- MSG91: https://msg91.com/help
- Twilio: https://support.twilio.com
- Fast2SMS: https://www.fast2sms.com/docs
