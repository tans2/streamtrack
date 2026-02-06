"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { notificationService } from '@/services/notificationService';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check your email link.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const result = await notificationService.verifyEmail(verificationToken);
      setStatus('success');
      setMessage(result.message || 'Your email has been verified successfully!');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to verify email. The link may have expired.');
    }
  };

  return (
    <div className="min-h-screen text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Scout" className="w-8 h-8" />
            <span className="text-2xl text-primary font-semibold">Scout</span>
          </div>
        </div>

        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="text-center">
            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Verifying Email
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Please wait while we verify your email address...
                </CardDescription>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Email Verified!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {message}
                </CardDescription>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Verification Failed
                </CardTitle>
                <CardDescription className="text-red-500">
                  {message}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="text-center">
            {status === 'success' && (
              <div className="space-y-4">
                <Button
                  onClick={() => router.push('/settings')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Go to Settings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  If your link has expired, you can request a new verification email from your Settings page.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push('/settings')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Go to Settings
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
