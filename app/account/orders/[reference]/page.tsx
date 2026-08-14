import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCustomerUser } from "../../../customer-auth";
import { getCustomerPortal } from "../../../customer-portal";
import { ORDER_STEPS, orderProgress } from "../../order-progress";
import styles from "./tracking.module.css";

type TrackingPageProps = { params: Promise<{ reference: string }> };

export const metadata: Metadata = {
  title: "Track your order | Buildanta",
  // An order page is personal and should never be indexed or previewed.
  robots: { index: false, follow: false },
};

const money = (value: string | number) =>
  `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const day = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

function Steps({ currentIndex, stopped }: { currentIndex: number; stopped: boolean }) {
  return (
    <ol className={styles.steps} aria-label="Order progress">
      {ORDER_STEPS.map((step, index) => {
        const state = stopped ? "stopped" : index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
        return (
          <li key={step.key} className={styles[state]} aria-current={state === "current" ? "step" : undefined}>
            <span className={styles.marker} aria-hidden="true">{state === "done" ? "✓" : index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default async function OrderTrackingPage({ params }: TrackingPageProps) {
  const { reference } = await params;
  const customer = await getCustomerUser();
  if (!customer) redirect(`/login?redirect=${encodeURIComponent(`/account/orders/${reference}`)}`);

  const portal = await getCustomerPortal();
  // The portal only ever returns this customer's own records, so finding the
  // reference in that list *is* the ownership check. Someone guessing another
  // customer's reference simply gets a 404.
  const quotation = portal.data?.quotations.find(
    (entry) => entry.reference === reference || entry.salesOrder?.reference === reference,
  );
  if (!quotation) notFound();

  const order = quotation.salesOrder;
  const progress = orderProgress(order, quotation.status);
  const lines = quotation.revisions[0]?.items ?? quotation.items;
  const dispatch = order?.dispatches?.[0];
  const nextDelivery = order?.deliverySchedules?.[0];

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <a href="/account">Your account</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Order {order?.reference ?? quotation.reference}</span>
      </nav>

      <header className={styles.head}>
        <p className={styles.kicker}>ORDER {order?.reference ?? quotation.reference}</p>
        <h1>{progress.headline}</h1>
        <p className={styles.detail}>{progress.detail}</p>
        {order?.reservedUntil && !progress.stopped ? (
          <p className={styles.reserved}>Stock reserved for you until {day(order.reservedUntil)}.</p>
        ) : null}
      </header>

      <section className={styles.card} aria-labelledby="progress-title">
        <h2 id="progress-title">Progress</h2>
        <Steps currentIndex={progress.currentIndex} stopped={progress.stopped} />
        {dispatch?.trackingReference ? (
          <p className={styles.tracking}>
            Tracking reference <strong>{dispatch.trackingReference}</strong>
          </p>
        ) : null}
        {nextDelivery ? (
          <p className={styles.tracking}>Scheduled for {day(nextDelivery.scheduledFor)}.</p>
        ) : null}
      </section>

      <section className={styles.card} aria-labelledby="items-title">
        <h2 id="items-title">What you ordered</h2>
        <ul className={styles.lines}>
          {lines.map((line, index) => (
            <li key={index}>
              <span>{line.description}</span>
              <small>{Number(line.quantity)} {line.unitCode}</small>
            </li>
          ))}
        </ul>
        {order ? (
          <dl className={styles.totals}>
            <div><dt>Order total</dt><dd>{money(order.grandTotal)}</dd></div>
            <div><dt>Payment</dt><dd>{order.paymentStatus.replaceAll("_", " ").toLowerCase()}</dd></div>
            <div><dt>Placed</dt><dd>{day(order.createdAt)}</dd></div>
          </dl>
        ) : null}
      </section>

      <section className={styles.help}>
        <h2>Need help with this order?</h2>
        <p>
          Quote <strong>{order?.reference ?? quotation.reference}</strong> and our team can
          pick it up straight away.
        </p>
        <a className="button orange" href="/more">Contact Buildanta <span aria-hidden="true">→</span></a>
      </section>
    </main>
  );
}
