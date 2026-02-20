"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { NavBar } from '@/components/ui/nav-bar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Check your email for the reset link');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <NavBar variant="auth" backHref="/auth" backLabel="Back to Login" />
      <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="w-full max-w-md">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="text-center">
            {sent ? (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Check Your Email
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <Mail className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Forgot Password?
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  No worries! Enter your email and we'll send you a link to reset your password.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  The link will expire in 1 hour. If you don't see the email, check your spam folder.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push('/auth')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Back to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSent(false);
                      setEmail('');
                    }}
                  >
                    Try Another Email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-card-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}

            {!sent && (
              <div className="text-center mt-6">
                <p className="text-muted-foreground">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/auth')}
                    className="text-primary hover:text-primary/80 underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
