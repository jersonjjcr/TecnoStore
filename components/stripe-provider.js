import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeProvider({ children }) {
  const options = {
    // passing the client secret obtained from the server
    fonts: [
      {
        cssSrc: "https://fonts.googleapis.com/css?family=Helvetica+Neue",
      },
    ],
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
