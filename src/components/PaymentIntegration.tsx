import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';

// Replace with your actual publishable key or use an env variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface PaymentFormProps {
  /**
   * Display-only label. The payable amount is resolved server-side from the
   * stored appointment, so this value is never sent to Stripe and never
   * trusted for the charge.
   */
  amount: number;
  appointmentId: string;
  onSuccess: () => void;
}

function PaymentForm({ amount, appointmentId, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create PaymentIntent on server. Only the appointment id is sent:
      // the server reads the canonical amount from the booking itself, so a
      // tampered client cannot choose what it is charged.
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      const { clientSecret, error: serverError } = await response.json();
      if (serverError) throw new Error(serverError);

      // 2. Confirm card payment
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement! },
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
            onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl">
      <CardElement className="p-3 border rounded" />
      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full bg-brand-navy text-brand-gold py-2 rounded-xl font-bold disabled:opacity-50"
      >
        {loading ? 'جاري الدفع...' : `دفع $${(amount / 100).toFixed(2)}`}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}

export default function PaymentIntegration({ amount, appointmentId, onSuccess }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm amount={amount} appointmentId={appointmentId} onSuccess={onSuccess} />
    </Elements>
  );
}
