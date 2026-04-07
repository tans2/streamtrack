"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NavBar } from '@/components/ui/nav-bar';
import { OnboardingModal } from '@/components/OnboardingModal';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { login, register, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        router.push('/search');
      } else {
        const result = await register(email, password, name, undefined, inviteCode || undefined);
        const userId = (result as any)?.id ?? email;
        const onboarded = localStorage.getItem(`scout_onboarded_${userId}`);
        if (!onboarded) {
          setShowOnboarding(true);
        } else {
          router.push('/search');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    const userId = user?.id ?? email;
    localStorage.setItem(`scout_onboarded_${userId}`, '1');
    setShowOnboarding(false);
    router.push('/search');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <NavBar variant="auth" backHref="/" backLabel="Back" />
      <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="w-full max-w-md">
        {/* Scout Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Scout" className="w-20 h-20" />
        </div>

        <Card className="bg-card border-border shadow-lg rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-card-foreground">
              {isLogin ? 'Welcome Back' : 'Join Scout'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin ? 'Ready to jump back in?' : 'Create your account to start tracking shows across all streaming platforms'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-card-foreground">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-card-foreground">Password</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="text-sm text-primary hover:text-primary/80 underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  minLength={8}
                  required
                />
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-card-foreground">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter your beta invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary uppercase"
                  />
                  <p className="text-xs text-muted-foreground">Required during private beta.</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6 rounded-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-muted-foreground">
                {isLogin ? 'New to Scout? ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  {isLogin ? 'Create an Account' : 'Sign in'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  );
}
