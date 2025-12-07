'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  auth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult 
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

interface PhoneAuthProps {
  onSuccess?: (phoneNumber: string, uid: string) => void;
  onError?: (error: string) => void;
}

export function PhoneAuth({ onSuccess, onError }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Setup reCAPTCHA
  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
          recaptchaVerifierRef.current = null;
        }
      });
    }
  };

  // Format phone number with country code
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add India country code if not present
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    return `+91${cleaned}`;
  };

  // Send OTP
  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate phone number
      const cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      setupRecaptcha();
      
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized. Please refresh the page.');
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      
      setConfirmationResult(result);
      setStep('otp');
      setCountdown(60); // 60 seconds countdown for resend
      
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      
      // Reset reCAPTCHA on error
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!confirmationResult) {
        throw new Error('Please request OTP first');
      }

      if (otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      setStep('success');
      onSuccess?.(user.phoneNumber || phoneNumber, user.uid);
      
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'OTP expired. Please request a new one.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtp('');
    recaptchaVerifierRef.current = null;
    await handleSendOTP();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* reCAPTCHA container (invisible) */}
      <div ref={recaptchaContainerRef} id="recaptcha-container"></div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Phone Number Input */}
      {step === 'phone' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Enter your phone number</h2>
            <p className="text-gray-500 text-sm mt-1">
              We&apos;ll send you a 6-digit verification code
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-gray-100 border rounded-lg text-gray-600 font-medium">
                +91
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="flex-1"
              />
            </div>
          </div>

          <Button 
            onClick={handleSendOTP} 
            disabled={loading || phoneNumber.length !== 10}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Verify OTP</h2>
            <p className="text-gray-500 text-sm mt-1">
              Enter the 6-digit code sent to +91 {phoneNumber}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <Button 
            onClick={handleVerifyOTP} 
            disabled={loading || otp.length !== 6}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in <span className="font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-primary hover:underline"
              >
                Didn&apos;t receive OTP? Resend
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError('');
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ← Change phone number
          </button>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-green-600">Phone Verified!</h2>
          <p className="text-gray-500 text-sm">
            Your phone number +91 {phoneNumber} has been verified successfully.
          </p>
        </div>
      )}
    </div>
  );
}
