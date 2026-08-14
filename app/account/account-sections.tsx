import type { CustomerUser } from "../customer-auth";
import { CustomerLogoutButton } from "../customer-logout-button";
import { orderProgress } from "./order-progress";
import styles from "./account.module.css";

const money = (value: string | number) =>
  `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const day = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

function initialsOf(customer: CustomerUser) {
  const source = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.displayName || customer.email;
  return source.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

/**
 * The account identity card.
 *
 * Replaces a bare "Email address" row. It states plainly that orders are now
 * linked to the account rather than matched on whatever email was typed at
 * checkout, because that was the source of the "no quotations yet" confusion.
 */
export function AccountSummary({ customer, orderCount }: { customer: CustomerUser; orderCount: number }) {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.displayName;

  return (
    <section className={styles.summary} aria-labelledby="account-summary-title">
      <div className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">{initialsOf(customer)}</span>
        <div>
          <h2 id="account-summary-title">{name}</h2>
          <p className={styles.email}>{customer.email}</p>
        </div>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Orders and quotations</dt>
          <dd>{orderCount}</dd>
        </div>
        <div>
          <dt>Delivery area</dt>
          <dd>Kanpur</dd>
        </div>
      </dl>

      <p className={styles.note}>
        Anything you order while signed in is saved to this account, so you can
        find and track it here later.
      </p>

      <CustomerLogoutButton />
    </section>
  );
}

type OrderLike = {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  items: { description: string }[];
  revisions: { grandTotal: string | number }[];
  salesOrder: null | {
    reference: string;
    status: string;
    grandTotal: string | number;
    dispatches?: { status: string; deliveredAt?: string | null; dispatchedAt?: string | null }[];
  };
};

/**
 * One row per order, leading with where it is rather than which internal
 * status table it came from. The full commercial detail stays on the cards
 * below; this is the "what happened to my stuff" view.
 */
export function OrderList({ quotations }: { quotations: OrderLike[] }) {
  return (
    <ul className={styles.orders}>
      {quotations.map((quotation) => {
        const progress = orderProgress(quotation.salesOrder, quotation.status);
        const reference = quotation.salesOrder?.reference ?? quotation.reference;
        const total = quotation.salesOrder?.grandTotal ?? quotation.revisions[0]?.grandTotal;
        const summary = quotation.items.map((item) => item.description).join(", ");

        return (
          <li key={quotation.id} className={progress.stopped ? `${styles.order} ${styles.orderStopped}` : styles.order}>
            <div className={styles.orderMain}>
              <p className={styles.orderRef}>{reference}</p>
              <h3>{progress.headline}</h3>
              <p className={styles.orderItems}>{summary}</p>
              <p className={styles.orderMeta}>
                {day(quotation.createdAt)}
                {total != null ? ` · ${money(total)}` : ""}
              </p>
            </div>
            <a className={styles.orderAction} href={`/account/orders/${reference}`}>
              Track order <span aria-hidden="true">→</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
