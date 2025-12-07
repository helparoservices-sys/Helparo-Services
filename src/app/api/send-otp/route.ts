import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json()

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    const smsEnabled = process.env.NEXT_PUBLIC_SMS_ENABLED === 'true'
    
    if (!smsEnabled) {
      // Development mode - just return success
      console.log('📱 SMS (Dev Mode) - OTP:', otp, 'to', phoneNumber)
      return NextResponse.json({
        success: true,
        message: 'OTP sent (dev mode - check console)',
        devMode: true
      })
    }

    // Production mode - Send actual SMS
    const provider = process.env.SMS_PROVIDER || 'msg91'

    if (provider === 'msg91') {
      const authKey = process.env.SMS_AUTH_KEY
      const senderId = process.env.SMS_SENDER_ID || 'HELPRO'
      
      if (!authKey) {
        throw new Error('SMS_AUTH_KEY not configured')
      }

      // MSG91 API v5
      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          template_id: process.env.SMS_TEMPLATE_ID,
          mobile: phoneNumber.replace(/\D/g, ''),
          sender: senderId,
          otp: otp,
          otp_expiry: 5 // 5 minutes
        })
      })

      const data = await response.json()

      if (data.type === 'success') {
        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully via SMS'
        })
      } else {
        throw new Error(data.message || 'Failed to send SMS')
      }
    } else if (provider === 'twilio') {
      // Twilio implementation
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const fromNumber = process.env.TWILIO_PHONE_NUMBER

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured')
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: fromNumber,
            Body: `Your Helparo OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully via SMS'
        })
      } else {
        throw new Error(data.message || 'Failed to send SMS')
      }
    } else if (provider === 'fast2sms') {
      // Fast2SMS (Indian SMS service)
      const apiKey = process.env.FAST2SMS_API_KEY
      
      if (!apiKey) {
        throw new Error('FAST2SMS_API_KEY not configured')
      }

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          sender_id: 'HELPRO',
          message: `Your Helparo OTP is ${otp}. Valid for 5 minutes.`,
          variables_values: otp,
          flash: 0,
          numbers: phoneNumber.replace(/\D/g, '')
        })
      })

      const data = await response.json()

      if (data.return) {
        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully via SMS'
        })
      } else {
        throw new Error(data.message || 'Failed to send SMS')
      }
    }

    throw new Error('Invalid SMS provider configured')

  } catch (error) {
    const err = error as Error
    console.error('Send SMS Error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
