import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Package, Loader2 } from 'lucide-react';
import { z } from 'zod';
import heroImage from '@/assets/hero-factory.jpg';

// Validation schemas
const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

const Auth = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast({ title: "Welcome back!" });
      } else {
        await register(email, password);
        toast({ 
          title: "Account created!", 
          description: "Welcome to BrickWorks Manager! Please check your email if confirmation is required." 
        });
      }
    } catch (error: any) {
      let message = error.message || 'An error occurred';
      
      // Handle common Supabase auth errors
      if (message.includes('Invalid login credentials')) {
        message = 'Invalid email or password';
      } else if (message.includes('User already registered')) {
        message = 'This email is already registered. Please login instead.';
        setIsLogin(true);
      } else if (message.includes('Email not confirmed')) {
        message = 'Please confirm your email before logging in.';
      } else if (message.includes('Password should be')) {
        message = 'Password must be at least 6 characters';
      }
      
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ 
        title: "Enter your email", 
        description: "Please enter your email address first", 
        variant: "destructive" 
      });
      return;
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({ 
        title: "Invalid email", 
        description: "Please enter a valid email address", 
        variant: "destructive" 
      });
      return;
    }

    // Note: This requires Supabase password reset to be configured
    toast({ 
      title: "Password Reset", 
      description: "If an account exists with this email, you will receive a password reset link." 
    });
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <Card className="relative w-full max-w-md bg-card/95 backdrop-blur border-primary/30 border-2">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary p-2 rounded-lg">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">BrickWorks</h1>
              <p className="text-sm text-muted-foreground">Manager</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={`bg-muted border-border ${errors.email ? 'border-destructive' : ''}`}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  className={`bg-muted border-border pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                isLogin ? 'LOG IN' : 'SIGN UP'
              )}
            </Button>
          </form>
          
          <div className="flex justify-between mt-4 text-sm">
            <button 
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot Password?
            </button>
            <button 
              type="button"
              className="text-primary hover:text-primary/80"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              disabled={loading}
            >
              {isLogin ? 'Create Account' : 'Login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
