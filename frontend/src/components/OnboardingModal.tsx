"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import { ArrowRight, Bell, Check, Tv } from 'lucide-react';

const PLATFORMS = [
  'Netflix', 'Hulu', 'Disney+', 'Prime Video', 'Paramount+',
  'Peacock', 'HBO Max', 'Apple TV+', 'YouTube TV', 'Fubo TV',
];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [savingPlatforms, setSavingPlatforms] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const { user, updatePreferences } = useAuth();

  const togglePlatform = (p: string) =>
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );

  const handlePlatformsNext = async () => {
    setSavingPlatforms(true);
    try {
      if (selectedPlatforms.length > 0) {
        await updatePreferences({ connected_platforms: selectedPlatforms });
      }
    } catch {
      // non-fatal — proceed anyway
    } finally {
      setSavingPlatforms(false);
      setStep(3);
    }
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await notificationService.sendVerificationEmail();
      setVerificationSent(true);
    } catch {
      toast.error('Could not send verification email. You can do this later in Settings.');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 [&>button:last-child]:hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Step indicator */}
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">
            Step {step} of 3
          </p>

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center">
              <img src="/logo.png" alt="Scout" className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to Scout{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-muted-foreground mb-8">
                Track your favourite shows, sync with friends, and never miss a new episode. Let's get you set up in 2 quick steps.
              </p>
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                onClick={() => setStep(2)}
              >
                Let's Go
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Streaming Platforms ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tv className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Your platforms</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Select the services you subscribe to so Scout can filter what's available to you.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {PLATFORMS.map(p => {
                  const active = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/50'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className="truncate">{p}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={savingPlatforms}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  onClick={handlePlatformsNext}
                  disabled={savingPlatforms}
                >
                  {savingPlatforms ? 'Saving…' : 'Next'}
                  {!savingPlatforms && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Notifications ── */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Stay in the loop</h2>
              <p className="text-muted-foreground mb-6">
                Verify your email to get notified when new episodes drop for shows you're tracking.
              </p>

              {verificationSent ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Verification email sent — check your inbox!
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mb-3 rounded-full"
                  onClick={handleSendVerification}
                  disabled={sendingVerification}
                >
                  {sendingVerification ? 'Sending…' : 'Verify My Email'}
                </Button>
              )}

              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                onClick={onComplete}
              >
                Start Watching
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You can always verify your email later in Settings.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
