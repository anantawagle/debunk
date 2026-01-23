import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, User, CreditCard } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getRemainingCredits } from '@/lib/credits';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onSignInClick?: () => void;
}

export function Header({ onSignInClick }: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    setIsLoggedIn(apiClient.isAuthenticated());
    setCredits(getRemainingCredits());

    // Listen for authentication changes
    const checkAuth = () => {
      setIsLoggedIn(apiClient.isAuthenticated());
      setCredits(getRemainingCredits());
    };
    window.addEventListener('storage', checkAuth);

    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 group-hover:border-primary/50 transition-colors">
              <Zap className="h-5 w-5 text-primary" />
              <div className="absolute inset-0 rounded-lg bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-foreground">Debunk</span>
              <span className="text-gradient">AI</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Detect
            </Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Credits indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{credits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>

            {isLoggedIn ? (
               <Link to="/dashboard">
                 <Button variant="outline" size="sm" className="gap-2">
                   <User className="h-4 w-4" />
                   Dashboard
                 </Button>
               </Link>
             ) : onSignInClick ? (
               <Button variant="default" size="sm" onClick={onSignInClick}>
                 Sign In
               </Button>
             ) : (
               <Link to="/auth">
                 <Button variant="default" size="sm">
                   Sign In
                 </Button>
               </Link>
             )}
          </div>
        </div>
      </div>
    </header>
  );
}
