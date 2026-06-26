'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCheck, FiLock, FiStar, FiZap, FiShield, FiArrowLeft } from 'react-icons/fi';
import { paymentService } from '@/services/paymentService';
import { authService } from '@/services/authService';
import { useAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';

const premiumBenefits = [
  'Access all private/premium prompts',
  'Unlock full prompt content',
  'Copy any prompt unlimited times',
  'Priority support',
  'No advertisements',
  'Support creators directly',
];

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const stripeRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isPremium, user, updateUser } = useAuth();

  useEffect(() => {
    let cardElement: any = null;

    const initStripe = async () => {
      try {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!key) {
          console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Restart the dev server.');
          return;
        }
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(key);
        if (!stripe || !cardContainerRef.current) return;

        const elements = stripe.elements();
        cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#94a3b8',
              '::placeholder': { color: '#64748b' },
            },
            invalid: { color: '#ef4444' },
          },
        });
        cardElement.mount(cardContainerRef.current);

        stripeRef.current = stripe;
        cardRef.current = cardElement;
        setStripeReady(true);
      } catch (err) {
        console.error('Failed to load Stripe:', err);
      }
    };

    initStripe();

    return () => {
      if (cardElement) {
        cardElement.destroy();
      }
    };
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const stripe = stripeRef.current;
    const cardElement = cardRef.current;

    if (!stripe || !cardElement) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.createIntent();

      const { error, paymentIntent } = await stripe.confirmCardPayment(response.data.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed.');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'requires_action') {
        toast.error('Payment requires additional authentication. Please try again.');
        setLoading(false);
        return;
      }

      await paymentService.confirm(response.data.paymentIntentId);
      const freshUser = await authService.getMe();
      if (freshUser.data) {
        updateUser(freshUser.data);
      } else if (user) {
        updateUser({ ...user, isPremium: true });
      }
      toast.success('Welcome to Premium!');
      router.back();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Payment confirmation failed.';
      try {
        const freshUser = await authService.getMe();
        if (freshUser.data?.isPremium) {
          updateUser(freshUser.data);
          toast.success('Welcome to Premium!');
          router.back();
          return;
        }
      } catch {}
      toast.error(message + ' Contact support if charged.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium) {
      router.replace('/dashboard/profile');
    }
  }, [isPremium, router]);

  if (isPremium) {
    return null;
  }

  return (
    <div className="min-h-screen py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm rounded-lg gap-1.5 mb-8">
          <FiArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <FiZap className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">Limited Time Offer</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Unlock <span className="gradient-text">Premium</span>
            </h1>
            <p className="text-base-content/60 mb-8">
              Get unlimited access to all premium prompts and features. One-time payment, lifetime access.
            </p>

            <div className="space-y-3">
              {premiumBenefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <FiCheck className="w-3.5 h-3.5 text-success" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:pl-8">
            <form onSubmit={handleSubscribe}>
              <div className="card bg-base-100 border border-primary/30 shadow-xl shadow-primary/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <p className="text-sm text-base-content/50 mb-1">One-time payment</p>
                    <p className="text-5xl font-bold">
                      $5<span className="text-lg text-base-content/40 font-normal">.00</span>
                    </p>
                    <p className="text-sm text-base-content/50 mt-1">Lifetime access</p>
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-base-content/70 mb-2 block">Card Details</label>
                    <div className="p-3 rounded-xl bg-base-200 border border-base-300">
                      <div ref={cardContainerRef} />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <FiStar className="w-4 h-4 text-warning" />
                      <span>All premium prompts unlocked</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FiLock className="w-4 h-4 text-success" />
                      <span>Secure payment via Stripe</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FiShield className="w-4 h-4 text-primary" />
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !stripeReady}
                    className="btn btn-primary w-full rounded-xl gap-2 text-base py-3 h-auto"
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <FiLock className="w-4 h-4" /> Pay $5 — Get Premium
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-base-content/40 mt-4">
                    Secured by Stripe. Your payment information is encrypted.
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}