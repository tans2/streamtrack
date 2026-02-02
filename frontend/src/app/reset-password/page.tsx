"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No reset token provided. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token!, newPassword);
      setStatus('success');
      toast.success('Password reset successfully!');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Play className="w-8 h-8 text-primary" />
            <span className="text-2xl text-primary font-semibold">Scout</span>
          </div>
        </div>

        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="text-center">
            {status === 'form' && (
              <>
                <div className="flex justify-center mb-4">
                  <KeyRound className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Reset Your Password
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your new password below.
                </CardDescription>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Password Reset!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your password has been changed successfully.
                </CardDescription>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Reset Failed
                </CardTitle>
                <CardDescription className="text-red-500">
                  {errorMessage}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {status === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-card-foreground">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                    minLength={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-card-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                    minLength={8}
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
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  You can now log in with your new password.
                </p>
                <Button
                  onClick={() => router.push('/auth')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Go to Login
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Please request a new password reset link.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push('/forgot-password')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Request New Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/auth')}
                  >
                    Back to Login
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
