'use client';

import { useState } from 'react';
import { Button } from './button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from './alert-dialog';

interface SignOutButtonProps {
  variant?: 'ghost' | 'default' | 'outline';
  className?: string;
}

export function SignOutButton({ variant = 'ghost', className = 'text-primary hover:text-primary hover:bg-primary/10' }: SignOutButtonProps) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign back in to access your watchlist and groups.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => logout()}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
