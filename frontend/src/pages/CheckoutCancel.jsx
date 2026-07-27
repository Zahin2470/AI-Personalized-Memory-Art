import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/Button';

export default function CheckoutCancel() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const [status, setStatus] = useState(() => (orderId ? 'cancelling' : 'done'));

  useEffect(() => {
    if (!orderId) return;
    api
      .post(`/orders/${orderId}/cancel`)
      .then(() => setStatus('done'))
      .catch(() => setStatus('done')); // order may already be paid/cancelled - either way, nothing more to do here
  }, [orderId]);

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="placard text-[11px] text-brass-deep">Checkout cancelled</p>
      <h1 className="mt-3 font-display text-4xl italic">No charge was made.</h1>
      <p className="mt-4 text-sm text-warmgray">
        {status === 'cancelling' ? 'Returning your items to your cart…' : 'Your items are back in your cart, whenever you’re ready.'}
      </p>
      <div className="mt-8">
        <Button as={Link} to="/cart" variant="primary">
          Back to cart
        </Button>
      </div>
    </div>
  );
}
