import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NavBar } from '@/components/ui/nav-bar';
import { OnboardingModal } from '@/components/OnboardingModal';

interface SignUpPageProps {
  onNavigate: (page: string) => void;
}

export default function SignUpPage({ onNavigate }: SignUpPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { register, user } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData.email, formData.password, formData.name, undefined, formData.inviteCode || undefined);
      const userId = (result as any)?.id ?? formData.email;
      const onboarded = localStorage.getItem(`scout_onboarded_${userId}`);
      if (!onboarded) {
        setShowOnboarding(true);
      } else {
        router.push('/search');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    const userId = user?.id ?? formData.email;
    localStorage.setItem(`scout_onboarded_${userId}`, '1');
    setShowOnboarding(false);
    router.push('/search');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
            <CardTitle className="text-2xl text-card-foreground">Join Scout</CardTitle>
            <CardDescription className="text-muted-foreground">
              Create your account to start tracking shows across all streaming platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-card-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-card-foreground">Referral Code</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder="Enter your referral code (optional)"
                  value={formData.inviteCode}
                  onChange={handleInputChange}
                  className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary uppercase"
                />
                <p className="text-xs text-muted-foreground">Have a referral code? Enter it here.</p>
              </div>

              <Button
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6 rounded-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button 
                  className="text-primary hover:text-primary/80 underline"
                  onClick={() => router.push('/auth')}
                >
                  Sign In
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