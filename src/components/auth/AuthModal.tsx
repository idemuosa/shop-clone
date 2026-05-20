import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithCustomToken,
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
import { API_URL } from '@/lib/api';
import PaymentMethods from './PaymentMethods';
import { ShieldCheck, Mail, Phone, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [tempData, setTempData] = useState<any>(null);
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

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    const identifier = email || phone;
    
    try {
      console.log(`Sending OTP to ${identifier} via ${API_URL}`);
      const response = await fetch(`${API_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          phone, 
          type: authMode 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTempData({ email, phone, name, password, identifier });
        setStep('otp');
        toast.info(`OTP sent to your ${email ? 'email' : 'phone'}`);
        if (data.devOtp) {
          console.log("DEMO OTP:", data.devOtp);
          toast.success(`Demo OTP: ${data.devOtp}`, { duration: 10000 });
        }
      } else {
        throw new Error(data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      toast.error(error.message, {
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
          identifier: tempData.identifier, 
          code: otpCode 
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      // 1. If we got a custom token, use it for seamless login (fixes invalid-credential)
      if (data.customToken) {
        try {
          await signInWithCustomToken(auth, data.customToken);
          toast.success("Identity Verified & Logged In!");
          onClose();
          return;
        } catch (tokenLoginError: any) {
          console.error("Custom token login failed:", tokenLoginError);
          // If custom token fails, we fall through to traditional flow
        }
      }

      // 2. Fallback to traditional flows if no token (legacy support)
      if (authMode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, tempData.email, tempData.password);
        await updateProfile(userCredential.user, { displayName: tempData.name });
        
        const isAdminEmail = tempData.email?.toLowerCase().trim() === 'idemudiawisdom27@gmail.com' ||
                           tempData.email === import.meta.env.VITE_ADMIN_EMAIL;

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: tempData.email,
          phone: tempData.phone || '',
          displayName: tempData.name,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        });

        // Send welcome
        fetch(`${API_URL}/api/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: tempData.email, name: tempData.name }),
        }).catch(console.error);

        toast.success("Registration Successful!");
      } else {
        // Login flow
        if (loginMethod === 'email') {
          try {
            await signInWithEmailAndPassword(auth, tempData.email, tempData.password);
          } catch (loginError: any) {
            // If user already exists but password is different, we can't auto-register easily via client SDK
            // The custom token from the server is the primary way to bypass this.
            // If we're here, it means custom token also failed.
            if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/user-not-found') {
               toast.error("Authentication failed. Please check your credentials or use the OTP sent.");
            } else {
               throw loginError;
            }
          }
        } else {
          // Phone login flow - handled by customToken from server
          toast.success("Phone Identity Verified!");
        }
        toast.success("Welcome Back!");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message, {
        style: { color: 'black' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] w-[95vw] rounded-3xl border-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-black text-center italic tracking-tighter">
            Welcome to <span className="text-purple-600">Vivo</span>
          </DialogTitle>
          <DialogDescription className="text-center font-medium text-xs sm:text-sm">
            Sign in to your account or create a new one.
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
                <TabsTrigger value="profile" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white  text-[9px] sm:text-[10px] tracking-widest leading-none py-2 sm:py-2.5">My Profile</TabsTrigger>
                <TabsTrigger value="payment" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white  text-[9px] sm:text-[10px] tracking-widest leading-none py-2 sm:py-2.5">Wallets</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="login" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white  text-[9px] sm:text-[10px] tracking-widest leading-none py-2 sm:py-2.5">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white  text-[9px] sm:text-[10px] tracking-widest leading-none py-2 sm:py-2.5">Join Free</TabsTrigger>
              </>
            )}
          </TabsList>

          {user ? (
            <>
              <TabsContent value="profile">
                <div className="space-y-4 sm:space-y-6 pt-2">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-[28px] sm:rounded-[32px] flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-xl shadow-purple-100 rotate-3">
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 border-4 border-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white">
                       <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black  tracking-tighter truncate">{user.displayName || 'Shop Explorer'}</h3>
                    <p className="text-[9px] sm:text-xs font-bold text-gray-400  tracking-widest">{user.email}</p>
                  </div>

                  <div className="bg-green-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-green-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-purple-600  tracking-widest uppercase">Vivo Status</p>
                      <h4 className="text-base sm:text-lg font-black  tracking-tighter italic">Premium <span className="text-purple-600">Member</span></h4>
                    </div>
                    <div className="bg-purple-600 p-1.5 sm:p-2 rounded-xl text-white">
                       <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  </div>

                  <Button 
                    onClick={() => signOut(auth).then(() => onClose())}
                    variant="ghost"
                    className="w-full rounded-2xl h-12 sm:h-14 font-black  tracking-widest text-[9px] sm:text-[10px] text-red-500 hover:bg-red-50 hover:text-red-600"
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
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-purple-600 mb-4">
                       <Lock className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black  tracking-tighter italic">Verify your <span className="text-purple-600">Identity</span></h3>
                    <p className="text-xs font-bold text-gray-400  tracking-widest leading-relaxed">
                      Enter the 6-digit code sent to <span className="text-black font-black italic">{tempData.identifier}</span>
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
                        className="text-center text-3xl font-black tracking-[0.5em] h-20 rounded-2xl border-4 border-gray-100 focus:border-purple-500 focus:ring-0 bg-gray-50 placeholder:text-gray-200"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        type="submit"
                        disabled={isLoading || otpCode.length < 6}
                        className="w-full bg-black hover:bg-zinc-800 text-white font-black rounded-2xl h-16 text-lg shadow-2xl shadow-zinc-200 transition-all active:scale-95"
                      >
                        {isLoading ? 'Verifying...' : 'Confirm & Login'}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="ghost"
                        onClick={() => setStep('form')}
                        className="w-full font-black  tracking-widest text-[10px] text-gray-400"
                      >
                        Change {loginMethod}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <TabsContent value="login" className="mt-0">
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                      <Button 
                        className={`flex-1 rounded-lg font-black text-[10px]  tracking-widest h-10 ${loginMethod === 'email' ? 'bg-white text-purple-600 shadow-sm' : 'bg-transparent text-gray-400'}`}
                        onClick={() => setLoginMethod('email')}
                        type="button"
                      >
                        <Mail className="h-3 w-3 mr-2" /> Email
                      </Button>
                      <Button 
                        className={`flex-1 rounded-lg font-black text-[10px]  tracking-widest h-10 ${loginMethod === 'phone' ? 'bg-white text-purple-600 shadow-sm' : 'bg-transparent text-gray-400'}`}
                        onClick={() => setLoginMethod('phone')}
                        type="button"
                      >
                        <Phone className="h-3 w-3 mr-2" /> Phone
                      </Button>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-5">
                      {loginMethod === 'email' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Email Address</Label>
                             <div className="relative">
                               <Input
                                 name="email"
                                 type="email"
                                 placeholder="hello@vivo.co"
                                 required
                                 autoComplete="username"
                                 className="pl-12 h-14 rounded-2xl border-2 border-gray-100 focus:border-purple-500 font-bold transition-all"
                               />
                               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Secure Password</Label>
                             <div className="relative">
                               <Input name="password" type="password" placeholder="••••••••" required autoComplete="current-password" className="pl-12 h-14 rounded-2xl border-2 border-gray-100 focus:border-purple-500 font-bold transition-all" />
                               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Phone Number</Label>
                           <div className="relative">
                             <Input name="phone" type="tel" placeholder="+234 000 000 0000" required className="pl-12 h-14 rounded-2xl border-2 border-gray-100 focus:border-purple-500 font-bold transition-all" />
                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                           </div>
                        </div>
                      )}

                      <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl h-16 shadow-2xl shadow-purple-200 transition-all active:scale-95 text-lg group">
                        {isLoading ? 'Preparing...' : (
                          <div className="flex items-center gap-2">
                             Send Secure OTP <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Your Full Name</Label>
                           <Input
                             name="name"
                             placeholder="Enter your Full Name"
                             required
                             autoComplete="name"
                             className="h-14 rounded-2xl border-2 border-gray-100 focus:border-purple-500 font-bold"
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
                             className="h-14 rounded-2xl border-2 border-gray-100 focus:border-purple-500 font-bold"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black  tracking-widest text-gray-400 ml-1">Create Password</Label>
                           <Input
                             name="password"
                             type="password"
                             placeholder="Min. 8 characters"
                             required
                             autoComplete="new-password"
                             className="h-14 rounded-2xl border-2 border-gray-100 focus:border-purple-500 font-bold"
                           />
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
                          <Badge className="bg-purple-600 text-white font-black border-none mb-4">Restricted Area</Badge>
                          <h3 className="text-3xl font-black italic tracking-tighter  mb-2">Staff Portal</h3>
                          <p className="text-[10px] font-bold text-gray-400  tracking-widest leading-relaxed max-w-[200px]">
                             Internal systems access for verified store managers.
                          </p>
                        </div>
                      </div>
                      <form onSubmit={handleSendOtp} className="space-y-4">
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
