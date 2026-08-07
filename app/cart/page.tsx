import { CartPageClient } from "./cart-page-client";
import styles from "./cart.module.css";

export default function CartPage() {
  return <main className={styles.page}>
    <div className={styles.header}>
      <p>YOUR CART</p>
      <h1>Review your materials</h1>
    </div>
    <CartPageClient />
  </main>;
}
