import { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

export default function StripePaymentForm({ amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    // Crear PaymentIntent cuando se monta el componente
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/payments/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount }),
        });

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Error al inicializar el pago");
        }
      } catch (err) {
        setError("Error al inicializar el pago");
      }
    };

    createPaymentIntent();
  }, [amount]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret || isProcessing || paymentCompleted) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Test User', // Puedes agregar campos para nombre si es necesario
          },
        },
        return_url: window.location.origin, // Para redirecciones si es necesario
      });

      if (confirmError) {
        setError(confirmError.message);
        setIsProcessing(false);
        return;
      }

      // Verificar que el pago fue exitoso
      if (paymentIntent.status === 'succeeded') {
        setPaymentCompleted(true);
        setIsProcessing(false);
        onSuccess({
          amount: amount,
          status: "succeeded",
          paymentIntentId: paymentIntent.id
        });
      } else {
        setError("El pago no se completó correctamente");
        setIsProcessing(false);
      }

    } catch (err) {
      setError("Error al procesar el pago: " + err.message);
      setIsProcessing(false);
      onError && onError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="field full">
        <label>Información de la tarjeta</label>
        <div className="card-element-container">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && <div className="error-card">{error}</div>}

      <div className="actions" style={{ justifyContent: "flex-start", marginTop: 20 }}>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!stripe || isProcessing || !clientSecret || paymentCompleted}
        >
          {paymentCompleted ? "Pago completado" : isProcessing ? "Procesando..." : `Pagar $${amount}`}
        </button>
      </div>
    </form>
  );
}
