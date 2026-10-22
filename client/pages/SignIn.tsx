import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider, isUsingDemoConfig } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function SignIn() {
  const { currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isUsingDemoConfig) {
      // Demo mode - simulate successful sign in
      setTimeout(() => {
        toast({
          title: "Demo Mode",
          description: "This is a demo. In production, configure your Firebase credentials.",
        });
        navigate("/dashboard");
        setLoading(false);
      }, 1500);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to Trifocus.",
      });
      navigate("/");
    } catch (error: any) {
      let errorMessage = "Failed to sign in. Please check your credentials.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    if (isUsingDemoConfig) {
      // Demo mode - simulate successful Google sign in
      setTimeout(() => {
        toast({
          title: "Demo Mode",
          description: "This is a demo. In production, configure your Firebase credentials.",
        });
        navigate("/dashboard");
        setLoading(false);
      }, 1500);
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in to Trifocus.",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      // Handle specific popup errors
      if (error.code === "auth/popup-closed-by-user") {
        toast({
          title: "Sign in cancelled",
          description: "Google sign-in was cancelled.",
          variant: "destructive"
        });
      } else if (error.code === "auth/popup-blocked") {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to sign in with Google.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sign in failed",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive"
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -top-10 left-1/2 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Back to home button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to home
        </Link>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="relative w-12 h-12 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xl">
                    <div className="relative w-7 h-7">
                      <div className="absolute inset-0 border-2 border-white/40 rounded-full animate-pulse" style={{animationDuration: '2s'}}></div>
                      <div className="absolute inset-1 border-2 border-white/60 rounded-full animate-pulse" style={{animationDuration: '1.5s', animationDelay: '0.3s'}}></div>
                      <div className="absolute inset-2 border-2 border-white/80 rounded-full animate-pulse" style={{animationDuration: '1s', animationDelay: '0.6s'}}></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                      <div className="absolute inset-0 animate-spin" style={{animationDuration: '8s'}}>
                        <div className="w-1 h-1 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
            <CardDescription className="text-slate-600">
              Sign in to your Trifocus account to continue your productivity journey
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Sign In */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full py-6 border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-all duration-300 group"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>
              

            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with email</span>
              </div>
            </div>

            {/* Email Sign In Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-6 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 py-6 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in to Trifocus"
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-slate-600 text-sm">Don't have an account? </span>
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                Sign up for free
              </Link>
            </div>

            {/* Early Access Badge */}
            <div className="text-center pt-4">
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                🚀 Early Access • Shape the Future
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
