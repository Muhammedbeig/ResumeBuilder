import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export const getStripe = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, { typescript: true });
  }
  return stripeClient;
};
