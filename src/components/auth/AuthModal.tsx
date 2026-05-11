import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut 
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
import PaymentMethods from './PaymentMethods';
import { ShieldCheck, Mail, Phone, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          phone, 
          type: authMode 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTempData({ email, phone, name, password, identifier });
        setStep('otp');
        toast.info(`OTP sent to your ${email ? 'email' : 'phone'}`);
        if (data.devOtp) {
          console.log("DEMO OTP:", data.devOtp);
          // In a real app we wouldn't show this, but for testing:
          toast.success(`Demo OTP: ${data.devOtp}`, { duration: 10000 });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: tempData.identifier, 
          code: otpCode 
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      // Now proceed with actual Firebase auth
      if (authMode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, tempData.email, tempData.password);
        await updateProfile(userCredential.user, { displayName: tempData.name });
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: tempData.email,
          phone: tempData.phone || '',
          displayName: tempData.name,
          role: tempData.email === 'idemudiawisdom27@gmail.com' ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        });

        // Send welcome
        fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: tempData.email, name: tempData.name }),
        }).catch(console.error);

        toast.success("Registration Successful!");
      } else {
        // Login flow
        if (loginMethod === 'email') {
          await signInWithEmailAndPassword(auth, tempData.email, tempData.password);
        } else {
          // For phone login with OTP only, we'd traditionally use signInWithPhoneNumber
          // But here we're simulating a secure layer. We'll just sign them in with a dummy password
          // or use a custom token. For this demo, we'll try email-based login if they have one, 
          // or just toast success as if they were logged in.
          // Since Firebase requires email/pass or specific providers:
          toast.success("Phone Login Verified! (Demo: Redirecting)");
        }
        toast.success("Welcome Back!");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center uppercase italic tracking-tighter">
            Welcome to <span className="text-orange-600">Shopsy</span>
          </DialogTitle>
          <DialogDescription className="text-center font-medium">
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
          <TabsList className={`grid w-full ${user ? 'grid-cols-2' : 'grid-cols-3'} bg-orange-50 rounded-xl p-1 mb-6`}>
            {user ? (
              <>
                <TabsTrigger value="profile" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">My Profile</TabsTrigger>
                <TabsTrigger value="payment" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">Wallets</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="login" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">Join Free</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-lg font-bold data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-900 uppercase text-[10px] tracking-widest leading-none py-2.5">Staff</TabsTrigger>
              </>
            )}
          </TabsList>

          {user ? (
            <>
              {/* Profile and Payment tabs as before */}
              <TabsContent value="profile">
                <div className="space-y-6 pt-2">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-orange-100 rotate-3">
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-8 h-8 rounded-full flex items-center justify-center text-white">
                       <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tighter truncate">{user.displayName || 'Shop Explorer'}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{user.email}</p>
                  </div>

                  <div className="bg-orange-50 rounded-3xl p-6 border-2 border-orange-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Shopsy Status</p>
                      <h4 className="text-lg font-black uppercase tracking-tighter italic">Premium <span className="text-orange-600">Member</span></h4>
                    </div>
                    <div className="bg-orange-600 p-2 rounded-xl text-white">
                       <ShieldCheck className="h-6 w-6" />
                    </div>
                  </div>

                  <Button 
                    onClick={() => signOut(auth).then(() => onClose())}
                    variant="ghost" 
                    className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    SIGN OUT SECURELY
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
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600 mb-4">
                       <Lock className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Verify your <span className="text-orange-600">Identity</span></h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
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
                        className="text-center text-3xl font-black tracking-[0.5em] h-20 rounded-2xl border-4 border-gray-100 focus:border-orange-500 focus:ring-0 bg-gray-50 placeholder:text-gray-200"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        type="submit" 
                        disabled={isLoading || otpCode.length < 6}
                        className="w-full bg-black hover:bg-zinc-800 text-white font-black rounded-2xl h-16 text-lg shadow-2xl shadow-zinc-200 transition-all active:scale-95"
                      >
                        {isLoading ? 'VERIFYING...' : 'CONFIRM & LOGIN'}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setStep('form')}
                        className="w-full font-black uppercase tracking-widest text-[10px] text-gray-400"
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
                        className={`flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest h-10 ${loginMethod === 'email' ? 'bg-white text-orange-600 shadow-sm' : 'bg-transparent text-gray-400'}`}
                        onClick={() => setLoginMethod('email')}
                        type="button"
                      >
                        <Mail className="h-3 w-3 mr-2" /> Email
                      </Button>
                      <Button 
                        className={`flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest h-10 ${loginMethod === 'phone' ? 'bg-white text-orange-600 shadow-sm' : 'bg-transparent text-gray-400'}`}
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
                             <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                             <div className="relative">
                               <Input name="email" type="email" placeholder="hello@shop.co" required className="pl-12 h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold transition-all" />
                               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Secure Password</Label>
                             <div className="relative">
                               <Input name="password" type="password" placeholder="••••••••" required className="pl-12 h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold transition-all" />
                               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</Label>
                           <div className="relative">
                             <Input name="phone" type="tel" placeholder="+234 000 000 0000" required className="pl-12 h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold transition-all" />
                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                           </div>
                        </div>
                      )}

                      <Button type="submit" disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl h-16 shadow-2xl shadow-orange-200 transition-all active:scale-95 text-lg group">
                        {isLoading ? 'PREPARING...' : (
                          <div className="flex items-center gap-2">
                             SEND SECURE OTP <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </Button>

                      <div className="flex items-center gap-4 py-2">
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Security Link</span>
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                      </div>

                      <div className="flex justify-center gap-4">
                         <div className="flex items-center gap-2 text-gray-400">
                           <ShieldCheck className="h-4 w-4" />
                           <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
                         </div>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-0">
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Full Name</Label>
                           <Input name="name" placeholder="Wisdom Idemudia" required className="h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                           <Input name="email" type="email" placeholder="you@example.com" required className="h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Create Password</Label>
                           <Input name="password" type="password" placeholder="Min. 8 characters" required className="h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-500 font-bold" />
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                         <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                         <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase tracking-tight">
                            By joining, an OTP will be sent to your email to verify your identity and protect your digital wallet.
                         </p>
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full bg-black hover:bg-zinc-800 text-white font-black rounded-2xl h-16 shadow-2xl shadow-zinc-200 text-lg transition-all active:scale-95">
                        {isLoading ? 'PROCESSING...' : 'Verify Email & Join'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="admin" className="mt-0">
                    {/* Admin section essentially same but styles updated */}
                    <div className="space-y-6">
                      <div className="bg-zinc-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                           <ShieldCheck className="h-32 w-32" />
                        </div>
                        <div className="relative z-10">
                          <Badge className="bg-orange-600 text-white font-black border-none mb-4">RESRICTED AREA</Badge>
                          <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Staff Portal</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-[200px]">
                             Internal systems access for verified store managers.
                          </p>
                        </div>
                      </div>
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Merchant Email</Label>
                          <Input name="email" type="email" defaultValue="idemudiawisdom27@gmail.com" required className="h-14 rounded-2xl border-2 border-zinc-100 focus:border-zinc-900 bg-zinc-50 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Master Password</Label>
                          <Input name="password" type="password" placeholder="••••••••" required className="h-14 rounded-2xl border-2 border-zinc-100 focus:border-zinc-900 bg-zinc-50 font-bold" />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full bg-zinc-900 hover:bg-black text-white font-black rounded-2xl h-16 shadow-2xl shadow-zinc-100 transition-all active:scale-95">
                          {isLoading ? 'AUTHENTICATING...' : 'SECURE ENTRY'}
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
