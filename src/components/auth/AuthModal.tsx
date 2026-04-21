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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import PaymentMethods from './PaymentMethods';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        displayName: name,
        role: email === 'idemudiawisdom27@gmail.com' ? 'admin' : 'user',
        createdAt: serverTimestamp(),
      });

      // Log notification for welcome email (simulated)
      await setDoc(doc(db, 'notifications', `welcome_${userCredential.user.uid}`), {
        type: 'welcome_email',
        userId: userCredential.user.uid,
        email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success('Account created successfully!');
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

        <Tabs defaultValue={user ? "payment" : "login"} className="w-full">
          <TabsList className={`grid w-full ${user ? 'grid-cols-2' : 'grid-cols-3'} bg-orange-50 rounded-xl p-1`}>
            {user ? (
              <>
                <TabsTrigger value="profile" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">Profile</TabsTrigger>
                <TabsTrigger value="payment" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">Payment</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="login" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest leading-none py-2.5">Join</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-lg font-bold data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-900 uppercase text-[10px] tracking-widest leading-none py-2.5">Admin</TabsTrigger>
              </>
            )}
          </TabsList>

          {user ? (
            <>
              <TabsContent value="profile">
                <div className="space-y-4 pt-4 text-center">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl font-black text-orange-600">
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{user.displayName}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Button 
                    onClick={() => signOut(auth).then(() => onClose())}
                    variant="outline" 
                    className="w-full border-2 rounded-xl h-12 font-bold text-red-500 hover:bg-red-50 hover:border-red-100"
                  >
                    Log Out
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="payment">
                <div className="pt-4">
                  <PaymentMethods />
                </div>
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="your@email.com" required className="rounded-xl border-2 focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required className="rounded-xl border-2 focus:border-orange-500" />
                  </div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-12" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'LOGIN'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" type="text" placeholder="John Doe" required className="rounded-xl border-2 focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" name="email" type="email" placeholder="your@email.com" required className="rounded-xl border-2 focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" name="password" type="password" required className="rounded-xl border-2 focus:border-orange-500" />
                  </div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-12" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'REGISTER'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <div className="pt-4 space-y-4">
                  <div className="bg-zinc-900 rounded-2xl p-6 text-white text-center">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-black">⚡</span>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Admin Center</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                      Access restricted to verified store managers and staff members only.
                    </p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin Email</Label>
                      <Input id="admin-email" name="email" type="email" defaultValue="idemudiawisdom27@gmail.com" required className="rounded-xl border-zinc-200 focus:border-zinc-900 bg-zinc-50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Secure Password</Label>
                      <Input id="admin-password" name="password" type="password" placeholder="••••••••" required className="rounded-xl border-zinc-200 focus:border-zinc-900 bg-zinc-50" />
                    </div>
                    <Button type="submit" className="w-full bg-zinc-900 hover:bg-black text-white font-black rounded-xl h-12 mt-2 transition-all active:scale-95 shadow-xl" disabled={isLoading}>
                      {isLoading ? 'VERIFYING...' : 'SECURE LOGIN'}
                    </Button>
                    <p className="text-center text-[10px] font-black text-gray-400 uppercase italic tracking-tighter pt-2">
                      Use the provided admin email and your secure password
                    </p>
                  </form>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
