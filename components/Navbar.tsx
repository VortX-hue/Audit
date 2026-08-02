import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-line)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "var(--color-ink)",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: -0.3,
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: "var(--color-invert-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 32 32" fill="none">
              <path
                d="M9 17.5L13.5 22L23 11"
                stroke="var(--color-invert-text)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Auditly
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <Link
            href="/#how-it-works"
            style={{ fontSize: 14, fontWeight: 500, color: "var(--color-muted)", textDecoration: "none" }}
          >
            How it works
          </Link>
          <Link
            href="/#pricing"
            style={{ fontSize: 14, fontWeight: 500, color: "var(--color-muted)", textDecoration: "none" }}
          >
            Pricing
          </Link>
          <Link
            href="/#faq"
            style={{ fontSize: 14, fontWeight: 500, color: "var(--color-muted)", textDecoration: "none" }}
          >
            FAQ
          </Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          <Link
            href="/app"
            style={{
              padding: "9px 18px",
              fontSize: 13.5,
              fontWeight: 700,
              borderRadius: 9,
              background: "var(--color-invert-bg)",
              color: "var(--color-invert-text)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}