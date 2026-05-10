"use client";

import { useEffect, useState } from "react";
import StripeProvider from "@/components/stripe-provider";
import StripePaymentForm from "@/components/stripe-payment-form";
import DashboardApp from "@/components/dashboard-app";

function fetchJson(url, options) {
  return fetch(url, { cache: "no-store", ...options }).then(async (response) => {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error || "Error en la solicitud.");
    }
    return json;
  });
}

function postJson(url, body) {
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export default function AuthApp() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [registration, setRegistration] = useState({
    storeName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [registrationMessage, setRegistrationMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchJson("/api/auth/me");
        if (data.user) {
          setUser(data.user);
          setStatus("ready");
        } else {
          setStatus("login");
        }
      } catch {
        setStatus("login");
      }
    }

    loadUser();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await postJson("/api/auth/login", credentials);
      setUser(data.user);
      setStatus("ready");
    } catch (loginError) {
      setError(loginError.message);
    }
  }

  async function handleLogout() {
    try {
      await postJson("/api/auth/logout", {});
    } catch {
      // ignore
    }
    setUser(null);
    setStatus("login");
    setAuthMode("login");
    setIsPaymentStep(false);
    setRegistrationMessage("");
    setError("");
  }

  function handleChange(field, value) {
    setRegistration((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegisterDetails(event) {
    event.preventDefault();
    setError("");

    if (!registration.storeName || !registration.email || !registration.password || !registration.confirmPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (registration.password !== registration.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsPaymentStep(true);
  }

  async function handlePaymentSubmit() {
    setError("");

    try {
      const response = await postJson("/api/auth/register", {
        storeName: registration.storeName,
        email: registration.email,
        password: registration.password,
        confirmPassword: registration.confirmPassword,
        subscriptionPlan: "Pro",
        paymentAmount: 25
      });

      setRegistrationMessage(response.message);
      setIsPaymentStep(false);
      setAuthMode("login");
      setRegistration({ storeName: "", email: "", password: "", confirmPassword: "" });
    } catch (registerError) {
      setError(registerError.message);
    }
  }

  if (status === "loading") {
    return (
      <div className="shell" style={{ padding: 24 }}>
        <div className="panel-card">
          <p className="eyebrow">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">{authMode === "login" ? "Inicia sesión" : "Registra tu tienda"}</p>
          <h2>
            {authMode === "login"
              ? "Accede a tu panel de TecnoStore"
              : "Crea una tienda y comienza con $25/mes"}
          </h2>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="form-grid">
              <div className="field full">
                <label htmlFor="login-email">Correo electrónico</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={credentials.email}
                  onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="field full">
                <label htmlFor="login-password">Contraseña</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>
              {error ? <div className="error-card">{error}</div> : null}
              <div className="actions" style={{ justifyContent: "space-between" }}>
                <button className="btn btn-primary" type="submit">
                  Iniciar sesión
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setError("");
                    setRegistrationMessage("");
                  }}
                >
                  Crear tienda
                </button>
              </div>
            </form>
          ) : (
            <>
              {!isPaymentStep ? (
                <form onSubmit={handleRegisterDetails} className="form-grid">
                  <div className="field full">
                    <label htmlFor="register-storeName">Nombre de la tienda</label>
                    <input
                      id="register-storeName"
                      type="text"
                      value={registration.storeName}
                      onChange={(event) => handleChange("storeName", event.target.value)}
                      required
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor="register-email">Correo electrónico</label>
                    <input
                      id="register-email"
                      type="email"
                      value={registration.email}
                      onChange={(event) => handleChange("email", event.target.value)}
                      required
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor="register-password">Contraseña</label>
                    <input
                      id="register-password"
                      type="password"
                      value={registration.password}
                      onChange={(event) => handleChange("password", event.target.value)}
                      required
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor="register-confirm-password">Confirmar contraseña</label>
                    <input
                      id="register-confirm-password"
                      type="password"
                      value={registration.confirmPassword}
                      onChange={(event) => handleChange("confirmPassword", event.target.value)}
                      required
                    />
                  </div>
                  {error ? <div className="error-card">{error}</div> : null}
                  <div className="actions" style={{ justifyContent: "flex-start" }}>
                    <button className="btn btn-primary" type="submit">
                      Siguiente: pago
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setError("");
                        setIsPaymentStep(false);
                      }}
                    >
                      Volver al login
                    </button>
                  </div>
                </form>
              ) : (
                <StripeProvider>
                  <div className="panel-card">
                    <p className="eyebrow">Pasarela de pagos</p>
                    <h3>Suscripción mensual</h3>
                    <p className="hero-copy">
                      El valor de la suscripción es de <strong>$25 USD</strong> por mes.
                    </p>
                    <div className="stack" style={{ marginTop: 18 }}>
                      <div className="mini-card">
                        <strong>Plan</strong>
                        <p className="muted">Pro mensual</p>
                      </div>
                      <div className="mini-card">
                        <strong>Precio</strong>
                        <p className="muted">$25 USD</p>
                      </div>
                      <div className="mini-card">
                        <strong>Estado</strong>
                        <p className="muted">Pago listo para procesar</p>
                      </div>
                    </div>
                    {error ? <div className="error-card">{error}</div> : null}
                    <StripePaymentForm
                      amount={25}
                      onSuccess={(paymentResult) => {
                        // Aquí puedes manejar el éxito del pago
                        console.log("Pago exitoso:", paymentResult);
                        handlePaymentSubmit();
                      }}
                      onError={(error) => {
                        setError("Error en el pago: " + error.message);
                      }}
                    />
                    <div className="actions" style={{ justifyContent: "flex-start", marginTop: 16 }}>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => setIsPaymentStep(false)}
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                </StripeProvider>
              )}
            </>
          )}

          {registrationMessage ? <div className="success-card">{registrationMessage}</div> : null}

          <div className="auth-footer">
            {authMode === "login" ? (
              <>
                <p>Usa admin@tecnostore.com / admin123 para el rol admin.</p>
                <p>Usa tienda1@tecnostore.com / tienda123 o tienda2@tecnostore.com / tienda123 para rol tienda.</p>
              </>
            ) : (
              <p>Tu tienda se registrará con un plan mensual de $25 USD y quedará pendiente de autorización.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <DashboardApp user={user} onLogout={handleLogout} />;
}
