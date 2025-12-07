'use client';

import { useState } from 'react';
import { PhoneAuth } from '@/components/auth/phone-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PhoneRegisterPage() {
  const [step, setStep] = useState<'phone' | 'details' | 'complete'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firebaseUid, setFirebaseUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  // Called when phone verification is successful
  const handlePhoneVerified = (phone: string, uid: string) => {
    setPhoneNumber(phone);
    setFirebaseUid(uid);
    setStep('details');
  };

  // Handle form submission to create user in your database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Call your API to create user in Supabase/your database
      // Example:
      // await fetch('/api/auth/register', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     phone: phoneNumber,
      //     firebaseUid: firebaseUid,
      //     fullName: formData.fullName,
      //     email: formData.email,
      //   })
      // });

      console.log('User Registration Data:', {
        phone: phoneNumber,
        firebaseUid,
        ...formData
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('complete');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            {step === 'phone' && 'Verify your phone number to get started'}
            {step === 'details' && 'Complete your profile'}
            {step === 'complete' && 'Welcome to Helparo!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Phone Verification */}
          {step === 'phone' && (
            <PhoneAuth 
              onSuccess={handlePhoneVerified}
              onError={(error) => console.error(error)}
            />
          )}

          {/* Step 2: User Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">
                  Phone verified: {phoneNumber}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={loading || !formData.fullName} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Account Created!</h3>
              <p className="text-gray-500">
                Welcome, {formData.fullName}! Your account has been created successfully.
              </p>
              <Button asChild className="w-full">
                <Link href="/customer/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          )}

          {/* Login link */}
          {step === 'phone' && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
