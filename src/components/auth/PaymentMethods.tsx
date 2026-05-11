import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentMethods() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'paymentMethods'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("PaymentMethods snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const cardNumber = formData.get('cardNumber') as string;
    const expiry = formData.get('expiry') as string;
    const cvc = formData.get('cvc') as string;
    const name = formData.get('name') as string;

    try {
      // Basic validation (mock)
      if (cardNumber.length < 16) throw new Error("Invalid card number");

      await addDoc(collection(db, 'users', user.uid, 'paymentMethods'), {
        last4: cardNumber.slice(-4),
        brand: cardNumber.startsWith('4') ? 'Visa' : 'MasterCard',
        expiry,
        name,
        createdAt: serverTimestamp(),
      });

      toast.success("Payment method added successfully!");
      setIsAdding(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'paymentMethods', id));
      toast.success("Payment method removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!user) return <div className="p-4 text-center text-gray-500">Please login to manage payment methods.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold uppercase tracking-tight">Your Cards</h3>
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="rounded-xl border-2 border-orange-100 hover:border-orange-500 hover:bg-orange-50 text-orange-600 gap-2"
          >
            <Plus className="h-4 w-4" /> Add New
          </Button>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleAddMethod} className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input id="name" name="name" placeholder="John Doe" required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input id="cardNumber" name="cardNumber" placeholder="0000 0000 0000 0000" maxLength={16} required className="rounded-xl pl-10" />
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry (MM/YY)</Label>
              <Input id="expiry" name="expiry" placeholder="MM/YY" required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" name="cvc" type="password" placeholder="123" maxLength={3} required className="rounded-xl" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsAdding(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Card'}
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Secure SSL Encrypted. Your data is protected.
          </p>
        </form>
      ) : (
        <div className="space-y-3">
          {methods.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl">
              <CreditCard className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No payment methods added yet.</p>
            </div>
          ) : (
            methods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-gray-50 hover:border-orange-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${method.brand === 'Visa' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      {method.brand} •••• {method.last4}
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </h4>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Expires {method.expiry}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteMethod(method.id)}
                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
