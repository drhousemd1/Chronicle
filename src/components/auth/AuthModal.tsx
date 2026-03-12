import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { z } from 'zod';

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

  const { signIn, signUp } = useAuth();

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
      >
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#2a2a2f] border border-[hsl(0_0%_100%_/_0.10)] rounded-xl text-white placeholder:text-[hsl(0_0%_100%_/_0.25)] focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent text-sm"
                disabled={isLoading}
              />
              {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[hsl(0_0%_100%_/_0.5)] text-xs font-bold uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#2a2a2f] border border-[hsl(0_0%_100%_/_0.10)] rounded-xl text-white placeholder:text-[hsl(0_0%_100%_/_0.25)] focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent text-sm"
                  disabled={isLoading}
                />
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
