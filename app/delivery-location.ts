export const DELIVERY_PIN_UPDATED_EVENT = "buildanta:delivery-pin-updated";
export const DELIVERY_PIN_CLEARED_EVENT = "buildanta:delivery-pin-cleared";
export const DELIVERY_PIN_STORAGE_KEY = "buildanta-delivery-pincode";

export function saveDeliveryPincode(value: string) {
  window.localStorage.setItem(DELIVERY_PIN_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(DELIVERY_PIN_UPDATED_EVENT, { detail: value }));
}

export function clearDeliveryPincode() {
  window.localStorage.removeItem(DELIVERY_PIN_STORAGE_KEY);
  window.dispatchEvent(new Event(DELIVERY_PIN_CLEARED_EVENT));
}
