import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { X, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { lovable } from '@/integrations/lovable/index';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; form?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setErrors({});
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        setErrors({ form: result.error.message || `Failed to sign in with ${provider}` });
      } else {
        onClose();
      }
    } catch (err) {
      setErrors({ form: `Failed to sign in with ${provider}` });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors(prev => ({ ...prev, form: undefined }));

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ form: 'This email is already registered. Please sign in instead.' });
          } else {
            setErrors({ form: error.message });
          }
        } else {
          onClose();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ form: 'Invalid email or password. Please try again.' });
          } else {
            setErrors({ form: error.message });
          }
        } else {
          onClose();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsSignUp(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetForm(); onClose(); } }}>
      <DialogContent
        className="bg-[hsl(240_6%_10%)] border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)] rounded-2xl p-0 max-w-md w-full [&>button]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {isSignUp ? 'Create account' : 'Sign in'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isSignUp
            ? 'Create a Chronicle account with email/password or social sign in.'
            : 'Sign in to Chronicle with email/password or social sign in.'}
        </DialogDescription>

        {/* Close button */}
        <button
          onClick={() => { resetForm(); onClose(); }}
          className="absolute top-4 right-4 text-[hsl(0_0%_100%_/_0.4)] hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#4a5f7f] flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-[#4a5f7f]/30 mx-auto mb-4">
              C
            </div>
            <h2 className="text-xl font-bold text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-[hsl(0_0%_100%_/_0.3)] text-sm mt-1">
              {isSignUp ? 'Sign up to start creating stories' : 'Sign in to continue your adventures'}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="flex gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleSocialLogin('apple')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2a2a2f] border border-[hsl(0_0%_100%_/_0.10)] rounded-xl text-white text-sm font-bold hover:bg-[#35353b] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.24 16.7 4.89 10.97 8.83 10.7c1.28.07 2.15.75 2.94.8.94-.19 1.85-.88 2.94-.8 1.54.12 2.7.74 3.46 1.88-3.14 1.87-2.42 6.04.88 7.2-.65 1.65-1.49 3.28-3 4.5zM12.03 10.87c-.2-2.37 1.76-4.4 3.97-4.57.33 2.64-2.36 4.72-3.97 4.57z"/>
              </svg>
              Apple
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2a2a2f] border border-[hsl(0_0%_100%_/_0.10)] rounded-xl text-white text-sm font-bold hover:bg-[#35353b] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[hsl(0_0%_100%_/_0.08)]" />
            <span className="text-[hsl(0_0%_100%_/_0.25)] text-xs uppercase tracking-wider font-bold">or</span>
            <div className="flex-1 h-px bg-[hsl(0_0%_100%_/_0.08)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[hsl(0_0%_100%_/_0.5)] text-xs font-bold uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#2a2a2f] border border-[hsl(0_0%_100%_/_0.10)] rounded-xl text-white placeholder:text-[hsl(0_0%_100%_/_0.25)] focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent text-sm"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[hsl(0_0%_100%_/_0.5)] text-xs font-bold uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 bg-[#2a2a2f] border border-[hsl(0_0%_100%_/_0.10)] rounded-xl text-white placeholder:text-[hsl(0_0%_100%_/_0.25)] focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(0_0%_100%_/_0.3)] hover:text-[hsl(0_0%_100%_/_0.5)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[hsl(0_0%_100%_/_0.5)] text-xs font-bold uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-10 bg-[#2a2a2f] border border-[hsl(0_0%_100%_/_0.10)] rounded-xl text-white placeholder:text-[hsl(0_0%_100%_/_0.25)] focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(0_0%_100%_/_0.3)] hover:text-[hsl(0_0%_100%_/_0.5)] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword}</p>}
              </div>
            )}

            {errors.form && (
              <p className="text-red-400 text-sm text-center">{errors.form}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#4a5f7f] hover:bg-[#5a6f8f] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-[#4a5f7f] hover:text-[#7ba3d4] text-sm transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
