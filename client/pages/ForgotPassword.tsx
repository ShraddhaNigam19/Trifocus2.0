import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isUsingDemoConfig } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isUsingDemoConfig) {
      // Demo mode - simulate password reset email sent
      setTimeout(() => {
        setEmailSent(true);
        toast({
          title: "Demo Mode",
          description: "This is a demo. In production, a real password reset email would be sent.",
        });
        setLoading(false);
      }, 1500);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast({
        title: "Password reset email sent!",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error: any) {
      let errorMessage = "Failed to send password reset email. Please try again.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      toast({
        title: "Reset failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setEmail("");
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
        {/* Back to sign in button */}
        <Link 
          to="/signin" 
          className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to sign in
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

            {!emailSent ? (
              <>
                <CardTitle className="text-2xl font-bold text-slate-900">Reset your password</CardTitle>
                <CardDescription className="text-slate-600">
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Check your email</CardTitle>
                <CardDescription className="text-slate-600">
                  We've sent a password reset link to <strong>{email}</strong>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {!emailSent ? (
              <>
                {/* Password Reset Form */}
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 py-6 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </form>

                {/* Additional Help */}
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Remember your password?{" "}
                    <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      Sign in
                    </Link>
                  </p>
                  <p className="text-xs text-slate-500">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Email Sent Success State */}
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <p className="text-emerald-800 text-sm font-medium mb-2">Email sent successfully!</p>
                    <p className="text-emerald-700 text-xs">
                      Click the link in the email to reset your password. The link will expire in 1 hour.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 text-center">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                    
                    <Button
                      variant="outline"
                      className="w-full py-6 border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-all duration-300"
                      onClick={handleResendEmail}
                    >
                      Send another email
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <Link 
                      to="/signin" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                    >
                      ← Back to sign in
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Security Note */}
            <div className="text-center pt-4">
              <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50">
                🔒 Secure password reset
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          For security reasons, we don't reveal whether an email address is registered
        </p>
      </div>
    </div>
  );
}
