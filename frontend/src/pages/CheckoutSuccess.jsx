import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="placard text-[11px] text-brass-deep">Order confirmed</p>
      <h1 className="mt-3 font-display text-4xl italic">It’s on its way to being made.</h1>
      <p className="mt-4 text-sm text-warmgray">
        We’ll start on your piece now. You can follow its status from your order history.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Button as={Link} to="/orders" variant="primary">
          View my orders
        </Button>
        <Button as={Link} to="/dashboard" variant="ghost">
          Back to memories
        </Button>
      </div>
      {orderId && <p className="placard mt-8 text-[10px] text-warmgray">Order #{orderId.slice(-8)}</p>}
    </div>
  );
}
