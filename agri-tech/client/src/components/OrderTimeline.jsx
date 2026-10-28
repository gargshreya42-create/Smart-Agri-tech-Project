import { formatDateTime } from '../utils/format';

const FLOW = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
const ICONS = { Pending: 'bi-hourglass-split', Confirmed: 'bi-check2-circle', Processing: 'bi-gear-fill', Shipped: 'bi-truck', Delivered: 'bi-box-seam-fill', Cancelled: 'bi-x-lg' };
const COPY = {
  Pending: 'Order placed — waiting for confirmation.',
  Confirmed: 'Order confirmed by the supplier.',
  Processing: 'Your items are being packed.',
  Shipped: 'On the way to your address.',
  Delivered: 'Delivered. Thank you for ordering!',
  Cancelled: 'This order was cancelled.',
};

// Visual order tracking built from the order's statusHistory.
export default function OrderTimeline({ order }) {
  const at = Object.fromEntries((order.statusHistory || []).map((h) => [h.status, h]));
  const reached = FLOW.filter((s) => at[s]);
  const currentIndex = order.status === 'Cancelled' ? -1 : FLOW.indexOf(order.status);

  const steps = order.status === 'Cancelled'
    ? [...reached.map((s) => ({ status: s, state: 'done' })), { status: 'Cancelled', state: 'cancelled' }]
    : FLOW.map((s, i) => ({ status: s, state: i < currentIndex ? 'done' : i === currentIndex ? (s === 'Delivered' ? 'done' : 'current') : 'todo' }));

  return (
    <ol className="timeline" aria-label="Order tracking">
      {steps.map(({ status, state }) => (
        <li key={status} className={state} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="dot"><i className={`bi ${state === 'done' && status !== 'Delivered' ? 'bi-check-lg' : ICONS[status]}`} aria-hidden="true" /></span>
          <div className={`fw-bold ${state === 'todo' ? 'text-muted' : ''}`}>{status}{state === 'current' && <span className="tone tone-amber ms-2">Current</span>}</div>
          <div className="small text-muted">{state === 'todo' ? 'Upcoming' : COPY[status]}</div>
          {at[status] && <div className="small text-muted">{formatDateTime(at[status].at)}{at[status].note && at[status].note !== 'Order placed' ? ` · ${at[status].note}` : ''}</div>}
        </li>
      ))}
    </ol>
  );
}
