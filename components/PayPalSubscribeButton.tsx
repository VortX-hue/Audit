"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: any;
  }
}

type Props = {
  planId: string;
  onSuccess: () => void;
};

export default function PayPalSubscribeButton({ planId, onSuccess }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsInstanceRef = useRef<any>(null);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Keep the latest onSuccess without making the effect depend on it —
  // onSuccess is an inline arrow fn in the parent, so it's a new
  // reference every render. Depending on it directly re-triggers the
  // effect on every parent re-render, causing PayPal's Buttons to be
  // rendered twice in quick succession (a race that crashes deep in
  // their SDK's internal zoid rendering).
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    let cancelled = false;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal isn't configured yet.");
      return;
    }

    const existingScript = document.getElementById(
      "paypal-sdk"
    ) as HTMLScriptElement | null;

    function renderButton() {
      if (cancelled || !window.paypal || !containerRef.current) return;

      // If a previous instance is still attached (e.g. Strict Mode's
      // double-invoke, or a fast planId change), close it before
      // rendering a new one instead of just clearing innerHTML — that
      // leaves PayPal's internal iframe/zoid state dangling.
      if (buttonsInstanceRef.current) {
        try {
          buttonsInstanceRef.current.close();
        } catch {
          // ignore — instance may already be torn down
        }
        buttonsInstanceRef.current = null;
      }
      containerRef.current.innerHTML = "";

      const instance = window.paypal.Buttons({
        style: {
          shape: "pill",
          color: "black",
          layout: "vertical",
          label: "subscribe",
        },
        createSubscription: (_data: any, actions: any) => {
          return actions.subscription.create({
            plan_id: planId,
          });
        },
        onApprove: async (data: any) => {
          setVerifying(true);
          setError("");
          try {
            const res = await fetch("/api/paypal/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscriptionID: data.subscriptionID }),
            });
            const result = await res.json();

            if (!res.ok || result.plan !== "pro") {
              setError(result.error || "Subscription could not be verified.");
              return;
            }

            onSuccessRef.current();
          } catch (err) {
            setError("Something went wrong verifying your subscription.");
          } finally {
            setVerifying(false);
          }
        },
        onError: () => {
          setError("PayPal ran into an issue. Please try again.");
        },
      });

      buttonsInstanceRef.current = instance;
      instance.render(containerRef.current);
    }

    if (existingScript && window.paypal) {
      renderButton();
    } else if (existingScript) {
      // Script tag exists but hasn't finished loading yet — wait for it
      // instead of assuming window.paypal is ready.
      existingScript.addEventListener("load", renderButton, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
      script.onload = renderButton;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (buttonsInstanceRef.current) {
        try {
          buttonsInstanceRef.current.close();
        } catch {
          // ignore
        }
        buttonsInstanceRef.current = null;
      }
    };
  }, [planId]);

  return (
    <div>
      <div ref={containerRef} />
      {verifying && (
        <p style={{ color: "#71717a", fontSize: 13, marginTop: 8 }}>
          Confirming your subscription…
        </p>
      )}
      {error && (
        <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
}