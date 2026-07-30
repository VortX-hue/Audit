import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata = {
  title: "Auditly — Shopify Store Audit Tool",
  description:
    "Paste a Shopify store URL and get an instant listing audit — SEO gaps, missing images, pricing errors, and inventory issues flagged in seconds.",
};

const CHECKS = [
  ["SEO", "Titles, handles, and product types built for search."],
  ["Images", "Missing photos and alt text that cost you conversions."],
  ["Pricing", "Zero-price listings and compare-at pricing errors."],
  ["Inventory & shipping", "Out-of-stock listings and missing shipping weights."],
];

const STEPS = [
  ["Paste your store URL", "No install, no Shopify app permissions — just your storefront URL."],
  ["We scan your catalog", "Up to 50 products, pulled live and read-only from your storefront."],
  ["Every listing gets checked", "12+ checks per product across SEO, images, pricing, and inventory."],
  ["You get a scored report", "Ranked by what's actually costing you sales, with fixes you can act on today."],
];

const FREE_FEATURES = [
  "3 audits per month",
  "Up to 50 products per audit",
  "Full scored report",
  "Per-product suggestions",
];

const PRO_FEATURES = [
  "Unlimited audits",
  "Up to 50 products per audit",
  "Full scored report",
  "Per-product suggestions",
  "CSV export",
  "Priority support",
];

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "80px 20px 60px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: 999,
              background: "#111",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
              marginBottom: 20,
            }}
          >
            STORE AUDIT
          </div>
          <h1
            style={{
              fontSize: 44,
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: -0.8,
              lineHeight: 1.15,
            }}
          >
            Know exactly what's holding your store back
          </h1>
          <p
            style={{
              color: "var(--color-muted)",
              fontSize: 18,
              maxWidth: 520,
              margin: "0 auto 32px",
              lineHeight: 1.5,
            }}
          >
            Paste a Shopify store URL and get an instant listing audit —
            scored, explained, and ready to act on.
          </p>
          <Link
            href="/app"
            style={{
              display: "inline-block",
              padding: "16px 32px",
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 12,
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            Analyze your store — free
          </Link>
        </div>

        {/* Score preview mock */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "26px 28px",
            marginBottom: 80,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontSize: 13, color: "var(--color-muted)", fontWeight: 600, marginBottom: 6 }}>
              STORE HEALTH SCORE
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 42,
                fontWeight: 700,
                color: "var(--color-warn)",
              }}
            >
              6.4<span style={{ fontSize: 18, color: "#a1a1aa" }}>/10</span>
            </p>
          </div>
          <div style={{ textAlign: "right", color: "var(--color-muted)", fontSize: 14 }}>
            <p>142 products scanned</p>
            <p>38 clean · 104 flagged</p>
          </div>
        </div>

        {/* What we check */}
        <ScrollReveal>
          <div style={{ marginBottom: 80 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-muted)",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              WHAT WE CHECK
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {CHECKS.map(([title, desc]) => (
                <div
                  key={title}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 20,
                    border: "1px solid var(--color-line)",
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13.5, color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* How it works */}
        <ScrollReveal>
          <div style={{ marginBottom: 80 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-muted)",
                marginBottom: 32,
                textAlign: "center",
              }}
            >
              HOW IT WORKS
            </p>
            <div>
              {STEPS.map(([title, desc], i) => (
                <div
                  key={title}
                  style={{
                    display: "flex",
                    gap: 20,
                    padding: "20px 0",
                    borderBottom: i < STEPS.length - 1 ? "1px solid var(--color-line)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      flexShrink: 0,
                      width: 28,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{title}</p>
                    <p style={{ fontSize: 14, color: "var(--color-muted)", lineHeight: 1.5 }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Pricing */}
        <ScrollReveal>
          <div style={{ marginBottom: 80 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-muted)",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              PRICING
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Free */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 28,
                  border: "1px solid var(--color-line)",
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-muted)", marginBottom: 8 }}>
                  FREE
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, marginBottom: 20, fontFamily: "var(--font-mono)" }}>
                  $0
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {FREE_FEATURES.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        color: "var(--color-ink)",
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ color: "var(--color-good)", fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro */}
              <div
                style={{
                  background: "#111",
                  borderRadius: 16,
                  padding: 28,
                  color: "#fff",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    background: "var(--color-accent)",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  POPULAR
                </span>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#a1a1aa", marginBottom: 8 }}>
                  PRO
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, marginBottom: 20, fontFamily: "var(--font-mono)" }}>
                  $19<span style={{ fontSize: 15, color: "#a1a1aa" }}>/mo</span>
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {PRO_FEATURES.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ color: "#4ade80", fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* FAQ */}
        <ScrollReveal>
          <div style={{ marginBottom: 80 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-muted)",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              FAQ
            </p>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "4px 24px",
                border: "1px solid var(--color-line)",
              }}
            >
              <FAQAccordion />
            </div>
          </div>
        </ScrollReveal>

        {/* Final CTA */}
        <ScrollReveal>
          <div
            style={{
              background: "#111",
              borderRadius: 16,
              padding: "32px 28px",
              textAlign: "center",
              color: "#fff",
              marginBottom: 40,
            }}
          >
            <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Run your first audit free
            </p>
            <p style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 24 }}>
              No install. No permissions. Results in seconds.
            </p>
            <Link
              href="/app"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10,
                background: "#fff",
                color: "#111",
                textDecoration: "none",
              }}
            >
              Get started
            </Link>
          </div>
        </ScrollReveal>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid var(--color-line)",
            fontSize: 13,
            color: "var(--color-muted)",
          }}
        >
          <span>© {new Date().getFullYear()} Auditly</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/app" style={{ color: "var(--color-muted)", textDecoration: "none" }}>
              App
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}