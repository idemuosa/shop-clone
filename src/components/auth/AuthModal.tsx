import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { API_URL, handleApiResponse } from '@/lib/api';
import PaymentMethods from './PaymentMethods';
import { ShieldCheck, Mail, Phone, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [otpCode, setOtpCode] = useState('');
  const [tempData, setTempData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const { user } = useAuth();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists, if not create it
      const docRef = doc(db, 'users', user.uid);
      const isAdminEmail = user.email?.toLowerCase().trim() === 'idemudiawisdom27@gmail.com' ||
                         user.email === import.meta.env.VITE_ADMIN_EMAIL;

      await setDoc(docRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: isAdminEmail ? 'admin' : 'user',
        lastLogin: serverTimestamp(),
      }, { merge: true });

      toast.success("Signed in with Google!");
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome Back!");
      onClose();
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error("Invalid email or password.");
      } else {
        toast.error(error.message || "Login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRegisterOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string || '').trim();
    const name = (formData.get('name') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();

    if (!email || !name || !password) {
      toast.error("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Sending registration OTP to ${email} via ${API_URL}`);
      const response = await fetch(`${API_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          type: 'register'
        }),
      });

      const data = await handleApiResponse(response);

      if (data.success) {
        setTempData({ email, name, password, identifier: email });
        setStep('otp');
        toast.success("Verification code sent to your email address");
      } else {
        throw new Error(data.message || "Failed to send verification code");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code", {
        style: { color: 'black' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: tempData?.identifier,
          code: otpCode 
        }),
      });

      const data = await handleApiResponse(response);
      if (!data.success) throw new Error(data.message || "Verification failed");

      // Register user with email and password after OTP verification
      const userCredential = await createUserWithEmailAndPassword(auth, tempData.email, tempData.password);
      await updateProfile(userCredential.user, { displayName: tempData.name });

      const isAdminEmail = tempData.email?.toLowerCase().trim() === 'idemudiawisdom27@gmail.com' ||
                         tempData.email === import.meta.env.VITE_ADMIN_EMAIL;

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: tempData.email,
        displayName: tempData.name,
        role: isAdminEmail ? 'admin' : 'user',
        createdAt: serverTimestamp(),
      });

      // Send welcome/verification email
      const verificationLink = `${window.location.origin}/verify?email=${encodeURIComponent(tempData.email)}`;
      fetch(`${API_URL}/api/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tempData.email,
          name: tempData.name,
          verificationLink
        }),
      }).catch(console.error);

      toast.success("Registration Successful!");
      onClose();
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("An account with this email already exists. Please log in.");
      } else {
        toast.error(error.message || "Verification failed", {
          style: { color: 'black' }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[350px] w-[92vw] rounded-[28px] border-none p-4 sm:p-5">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl sm:text-2xl font-black text-center italic tracking-tighter">
            Welcome to <span className="text-orange-600">Vivi</span>
          </DialogTitle>
          <DialogDescription className="text-center font-bold text-xs sm:text-sm uppercase tracking-widest opacity-60">
            Sign in or create account
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue={user ? "payment" : "login"}
          onValueChange={(val) => {
            if (val === 'login' || val === 'register') {
              setStep('form');
              setAuthMode(val as any);
            }
          }}
          className="w-full"
        >
          <TabsList className={`grid w-full ${user ? 'grid-cols-2' : 'grid-cols-2'} bg-green-50 rounded-xl p-1 mb-4 sm:mb-6`}>
            {user ? (
              <>
                <TabsTrigger value="profile" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white  text-xs sm:text-sm tracking-widest leading-none py-2 sm:py-2.5">My Profile</TabsTrigger>
                <TabsTrigger value="payment" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white  text-xs sm:text-sm tracking-widest leading-none py-2 sm:py-2.5">Wallets</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="login" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white  text-xs sm:text-sm tracking-widest leading-none py-2 sm:py-2.5">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white  text-xs sm:text-sm tracking-widest leading-none py-2 sm:py-2.5">Join Free</TabsTrigger>
              </>
            )}
          </TabsList>

          {user ? (
            <>
              <TabsContent value="profile">
                <div className="space-y-4 sm:space-y-6 pt-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[24px] sm:rounded-[28px] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-xl shadow-orange-100 rotate-3">
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 bg-green-500 border-2 border-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white">
                       <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-0.5">
                    <h3 className="text-lg sm:text-xl font-black  tracking-tighter truncate">{user.displayName || 'Explorer'}</h3>
                    <p className="text-[8px] sm:text-[9px] font-bold text-gray-400  tracking-widest uppercase">{user.email}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-100 flex items-center justify-between">
                    <div>
                      <p className="text-[7px] font-black text-orange-600  tracking-widest uppercase">Vivi Status</p>
                      <h4 className="text-sm sm:text-base font-black  tracking-tighter italic">Premium <span className="text-orange-600">Member</span></h4>
                    </div>
                    <div className="bg-orange-600 p-1 sm:p-1.5 rounded-lg text-white">
                       <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>

                    <Button
                    onClick={() => signOut(auth).then(() => onClose())}
                    variant="ghost"
                    className="w-full rounded-xl h-10 sm:h-12 font-black  tracking-widest text-[8px] sm:text-[9px] text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Sign out securely
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="payment">
                <div className="pt-2">
                  <PaymentMethods />
                </div>
              </TabsContent>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {step === 'otp' ? (
                <div className="space-y-6 py-4">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600 mb-4">
                       <Lock className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black  tracking-tighter italic">Verify your <span className="text-orange-600">Identity</span></h3>
                    <p className="text-xs font-bold text-gray-400  tracking-widest leading-relaxed">
                      Enter the 6-digit code sent to <span className="text-black font-black italic">{tempData?.identifier}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="flex justify-center gap-2">
                       <Input 
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-3xl font-black tracking-[0.5em] h-20 rounded-2xl border-4 border-gray-100 focus:border-orange-500 focus:ring-0 bg-gray-50 placeholder:text-gray-200"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        type="submit"
                        disabled={isLoading || otpCode.length < 6}
                        className="w-full bg-black hover:bg-zinc-800 text-white font-black rounded-2xl h-16 text-lg shadow-2xl shadow-zinc-200 transition-all active:scale-95"
                      >
                        {isLoading ? 'Verifying...' : 'Confirm & Register'}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="ghost"
                        onClick={() => setStep('form')}
                        className="w-full font-black  tracking-widest text-[10px] text-gray-400"
                      >
                        Back to Registration
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Email Address</Label>
                           <div className="relative">
                             <Input
                               name="email"
                               type="email"
                               placeholder="hello@vivi.co"
                               required
                               autoComplete="username"
                               className="pl-10 h-12 rounded-xl border-2 border-gray-100 focus:border-orange-500 font-bold transition-all text-sm"
                             />
                             <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[9px] font-black  tracking-widest text-gray-400 ml-1">Secure Password</Label>
                           <div className="relative">
                             <Input
                               name="password"
                               type={showPassword ? "text" : "password"}
                               placeholder="••••••••"
                               required
                               autoComplete="current-password"
                               className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-100 focus:border-orange-500 font-bold transition-all text-sm"
                             />
                             <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                             <button
                               type="button"
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                               aria-label={showPassword ? "Hide password" : "Show password"}
                             >
                               {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             </button>
                           </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-14 shadow-2xl shadow-orange-200 transition-all active:scale-95 text-base group">
                        {isLoading ? 'Signing in...' : (
                          <div className="flex items-center gap-2">
                             Log In <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </Button>

                      <div className="flex items-center gap-4 py-2">
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                        <span className="text-[10px] font-black text-gray-300  tracking-widest">Security Link</span>
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                      </div>

                      <div className="flex justify-center gap-4">
                         <div className="flex items-center gap-2 text-gray-400">
                           <ShieldCheck className="h-4 w-4" />
                           <span className="text-[9px] font-black  tracking-widest">End-to-End Encrypted</span>
                         </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          className="w-full rounded-2xl h-14 border-2 font-black  tracking-widest text-[10px] gap-3"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.75c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-0">
                    <form onSubmit={handleSendRegisterOtp} className="space-y-5">
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Your Full Name</Label>
                           <Input
                             name="name"
                             placeholder="Enter your Full Name"
                             required
                             autoComplete="name"
                             className="h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Email Address</Label>
                           <Input
                             name="email"
                             type="email"
                             placeholder="you@example.com"
                             required
                             autoComplete="email"
                             className="h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Create Password</Label>
                           <div className="relative">
                             <Input
                               name="password"
                               type={showRegisterPassword ? "text" : "password"}
                               placeholder="Min. 8 characters"
                               required
                               autoComplete="new-password"
                               className="pl-10 pr-10 h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold"
                             />
                             <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                             <button
                               type="button"
                               onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                               className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                               aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                             >
                               {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                             </button>
                           </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                         <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                         <p className="text-[10px] text-blue-700 font-bold leading-relaxed  tracking-tight">
                            By joining, an OTP will be sent to your email to verify your identity and protect your digital wallet.
                         </p>
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full bg-black hover:bg-zinc-800 text-white font-black rounded-2xl h-16 shadow-2xl shadow-zinc-200 text-lg transition-all active:scale-95">
                        {isLoading ? 'Processing...' : 'Verify Email & Join'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="admin" className="mt-0">
                    <div className="space-y-6">
                      <div className="bg-zinc-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                           <ShieldCheck className="h-32 w-32" />
                        </div>
                        <div className="relative z-10">
                          <Badge className="bg-orange-600 text-white font-black border-none mb-4">Restricted Area</Badge>
                          <h3 className="text-3xl font-black italic tracking-tighter  mb-2">Staff Portal</h3>
                          <p className="text-[10px] font-bold text-gray-400  tracking-widest leading-relaxed max-w-[200px]">
                             Internal systems access for verified store managers.
                          </p>
                        </div>
                      </div>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black  tracking-widest text-zinc-400">Merchant Email</Label>
                          <Input
                            name="email"
                            type="email"
                            placeholder="admin@vivo.co"
                            required
                            autoComplete="username"
                            className="h-14 rounded-2xl border-2 border-zinc-100 focus:border-zinc-900 bg-zinc-50 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black  tracking-widest text-zinc-400">Merchant Phone (Optional)</Label>
                          <Input
                            name="phone"
                            type="tel"
                            placeholder="+234 ..."
                            autoComplete="tel"
                            className="h-14 rounded-2xl border-2 border-zinc-100 focus:border-zinc-900 bg-zinc-50 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black  tracking-widest text-zinc-400">Master Password</Label>
                          <Input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            className="h-14 rounded-2xl border-2 border-zinc-100 focus:border-zinc-900 bg-zinc-50 font-bold"
                          />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full bg-zinc-900 hover:bg-black text-white font-black rounded-2xl h-16 shadow-2xl shadow-zinc-100 transition-all active:scale-95">
                          {isLoading ? 'Authenticating...' : 'Secure Entry'}
                        </Button>

                        <div className="flex items-center gap-4 py-2">
                          <div className="h-[1px] flex-1 bg-zinc-200"></div>
                          <span className="text-[9px] font-black text-zinc-400  tracking-widest">Or</span>
                          <div className="h-[1px] flex-1 bg-zinc-200"></div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          className="w-full rounded-2xl h-14 border-2 border-zinc-200 font-black  tracking-widest text-[10px] gap-3 hover:bg-zinc-50"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.75c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Staff Google Login
                        </Button>
                      </form>
                    </div>
                  </TabsContent>
                </>
              )}
            </div>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
