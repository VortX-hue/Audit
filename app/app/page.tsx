"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { SignOutButton, SignInButton, Show, UserButton } from "@clerk/nextjs";
import PayPalSubscribeButton from "@/components/PayPalSubscribeButton";

type Flag = {
  flag: string;
  suggestion: string;
};

type Product = {
  title: string;
  price: number;
  flags: Flag[];
};

type AuditHistoryItem = {
  id: string;
  store_url: string;
  score: number;
  total_products: number;
  clean_count: number;
  created_at: string;
};

type Toast = {
  id: number;
  message: string;
  tone: "good" | "bad";
  leaving?: boolean;
};

const ANALYZE_STEPS = [
  "Fetching product catalog…",
  "Checking SEO fields…",
  "Scanning images & pricing…",
  "Scoring listings…",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [cleanCount, setCleanCount] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isPro, setIsPro] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const toastIdRef = useRef(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load audit history on mount
  useEffect(() => {
    let cancelled = false;
    fetch("/api/audits")
      .then((res) => (res.ok ? res.json() : { audits: [] }))
      .then((data) => {
        if (!cancelled) setHistory(data.audits || []);
      })
      .catch(() => {
        /* silent — history is a nice-to-have, not core flow */
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Animate score counting up whenever a new score lands
  useEffect(() => {
    if (score === null) {
      setDisplayScore(0);
      return;
    }
    const duration = 700;
    const start = performance.now();
    const from = 0;
    const targetScore = score; // narrow once, outside the closure

    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayScore(Math.round((from + (targetScore - from) * eased) * 10) / 10);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  function pushToast(message: string, tone: "good" | "bad") {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 150);
    }, 3200);
  }

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setProducts([]);
    setScore(null);
    setExpanded({});
    setStepIndex(0);

    // Progressive step indicator — purely presentational while we wait
    // on the real request; caps out on the last step until it resolves.
    stepTimerRef.current = setInterval(() => {
      setStepIndex((prev) =>
        prev < ANALYZE_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 900);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        pushToast(data.error || "Something went wrong.", "bad");
      } else {
        setProducts(data.products);
        setScore(data.score);
        setCleanCount(data.cleanCount);
        pushToast(`Audit complete — scored ${data.score}/10`, "good");
        setHistory((prev) => [
          {
            id: `local-${Date.now()}`,
            store_url: url,
            score: data.score,
            total_products: data.totalProducts,
            clean_count: data.cleanCount,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      setError("Something went wrong reaching that store.");
      pushToast("Something went wrong reaching that store.", "bad");
    } finally {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setLoading(false);
    }
  }

  function scoreColor(s: number) {
    if (s >= 7.5) return "var(--color-good)";
    if (s >= 5) return "var(--color-warn)";
    return "var(--color-bad)";
  }

  function toggleFlag(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function exportCSV() {
    if (products.length === 0) return;
    const rows = [["Product", "Price", "Flag", "Suggestion"]];
    products.forEach((p) => {
      if (p.flags.length === 0) {
        rows.push([p.title, String(p.price), "No issues found", ""]);
      } else {
        p.flags.forEach((f) => {
          rows.push([p.title, String(p.price), f.flag, f.suggestion]);
        });
      }
    });
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `store-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    pushToast("CSV exported", "good");
  }

  const flagCounts: Record<string, number> = {};
  products.forEach((p) => {
    p.flags.forEach((f) => {
      const normalized = f.flag.replace(/^\d+\s/, "");
      flagCounts[normalized] = (flagCounts[normalized] || 0) + 1;
    });
  });
  const chartData = Object.entries(flagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Toasts */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 50,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={t.leaving ? "toast-exit" : "toast-enter"}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "#111",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 220,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: t.tone === "good" ? "#4ade80" : "#f87171",
                flexShrink: 0,
              }}
            />
            {t.message}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 20px" }}>
        {/* Account bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Show when="signed-in">
            <UserButton />
            <SignOutButton>
              <button
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  color: "var(--color-muted)",
                  border: "1px solid #e4e4e7",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f4f4f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Log out
              </button>
            </SignOutButton>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                style={{
                  padding: "8px 16px",
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "transform 0.1s",
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.97)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
        </div>

        {/* --- TEMPORARY: PayPal test section --- */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            marginBottom: 30,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          {isPro ? (
            <p style={{ color: "var(--color-good)", fontWeight: 700 }}>
              ✓ You're on Pro!
            </p>
          ) : (
            <>
              <p style={{ marginBottom: 12, fontWeight: 600 }}>
                Upgrade to Pro — $19/mo unlimited audits
              </p>
              <PayPalSubscribeButton
                planId={process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID!}
                onSuccess={() => {
                  setIsPro(true);
                  pushToast("Welcome to Pro!", "good");
                }}
              />
            </>
          )}
        </div>
        {/* --- END TEMPORARY --- */}

        <div style={{ textAlign: "center", marginBottom: 40 }}>
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
              marginBottom: 16,
            }}
          >
            STORE AUDIT
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 10,
              letterSpacing: -0.5,
            }}
          >
            Know exactly what's holding your store back
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: 17 }}>
            Paste a Shopify store URL and get an instant listing audit
          </p>
        </div>

        <div
          className="search-bar"
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 30,
            background: "#fff",
            padding: 10,
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && url) handleAnalyze();
            }}
            placeholder="e.g. examplestore.myshopify.com"
            style={{
              flex: 1,
              padding: "14px 16px",
              fontSize: 16,
              border: "none",
              outline: "none",
              borderRadius: 10,
            }}
          />
          <button
            onClick={handleAnalyze}
            className="analyze-btn"
            disabled={loading || !url}
            style={{
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: "none",
              background: loading ? "#3f3f46" : "#111",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              whiteSpace: "nowrap",
              transition: "transform 0.1s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading && url) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Analyzing…" : "Analyze Store"}
          </button>
        </div>

        {/* Progressive loading indicator */}
        {loading && (
          <div
            className="fade-in-up"
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid #e4e4e7",
                borderTopColor: "var(--color-accent)",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: 14, color: "var(--color-muted)", fontWeight: 500 }}>
              {ANALYZE_STEPS[stepIndex]}
            </span>
          </div>
        )}

        {/* Skeleton while loading, before results exist */}
        {loading && (
          <div style={{ marginBottom: 30 }}>
            <div
              className="skeleton"
              style={{ height: 100, marginBottom: 12 }}
            />
            <div className="skeleton" style={{ height: 70, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 70 }} />
          </div>
        )}

        {error && (
          <p
            className="fade-in-up"
            style={{
              color: "var(--color-bad)",
              background: "#fef2f2",
              padding: 14,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            {error}
          </p>
        )}

        {score !== null && (
          <div
            className="fade-in-up"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div
              className="stat-card"
              style={{
                padding: "26px 28px",
                borderRadius: 16,
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-muted)",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                STORE HEALTH SCORE
              </p>
              <p
                className="score-number"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 42,
                  fontWeight: 700,
                  color: scoreColor(score),
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayScore.toFixed(1)}
                <span style={{ fontSize: 18, color: "#a1a1aa" }}>/10</span>
              </p>
              <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 4 }}>
                {products.length} products · {cleanCount} clean
              </p>
            </div>

            {chartData.length > 0 && (
              <div
                className="stat-card"
                style={{
                  padding: "20px 24px",
                  borderRadius: 16,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-muted)",
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  TOP ISSUES
                </p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {score !== null && products.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button
              onClick={exportCSV}
              style={{
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                background: "#fff",
                color: "var(--color-ink)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              ↓ Export CSV
            </button>
          </div>
        )}

        {products.length > 0 && (
          <div>
            {products.map((p, i) => (
              <div
                key={i}
                className="product-card fade-in-up"
                style={{
                  border: "1px solid var(--color-line)",
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 12,
                  background: "#fff",
                  animationDelay: `${Math.min(i * 30, 300)}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong style={{ fontSize: 16 }}>{p.title}</strong>
                  <span style={{ color: "var(--color-muted)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                    ${p.price}
                  </span>
                </div>
                {p.flags.length > 0 ? (
                  <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none" }}>
                    {p.flags.map((f, j) => {
                      const key = `${i}-${j}`;
                      const isOpen = !!expanded[key];
                      return (
                        <li key={j} style={{ marginBottom: 8 }}>
                          <button
                            onClick={() => toggleFlag(key)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              width: "100%",
                              textAlign: "left",
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              color: "#b91c1c",
                              fontSize: 14,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                                transition: "transform 0.15s",
                                fontSize: 12,
                                color: "#a1a1aa",
                              }}
                            >
                              ▶
                            </span>
                            {f.flag}
                          </button>
                          {isOpen && (
                            <p
                              className="fade-in-up"
                              style={{
                                marginTop: 6,
                                marginLeft: 18,
                                padding: "10px 12px",
                                background: "#fafafa",
                                borderRadius: 8,
                                color: "#3f3f46",
                                fontSize: 13.5,
                                lineHeight: 1.5,
                                borderLeft: "3px solid #d1d5db",
                              }}
                            >
                              {f.suggestion}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p style={{ color: "var(--color-good)", marginTop: 4, fontSize: 14 }}>
                    ✓ No issues found
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state: shown before the first audit runs */}
        {!loading && score === null && !error && (
          <div className="fade-in-up" style={{ marginTop: 10 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 28,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                marginBottom: 24,
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 14 }}>
                WHAT WE CHECK
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {[
                  ["SEO", "Titles, handles, and product types built for search."],
                  ["Images", "Missing photos and alt text that cost you conversions."],
                  ["Pricing", "Zero-price listings and compare-at pricing errors."],
                  ["Inventory & shipping", "Out-of-stock listings and missing shipping weights."],
                ].map(([title, desc]) => (
                  <div key={title as string}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{title}</p>
                    <p style={{ fontSize: 13.5, color: "var(--color-muted)", lineHeight: 1.5 }}>
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit history */}
            {!historyLoading && history.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 10 }}>
                  RECENT AUDITS
                </p>
                {history.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      background: "#fff",
                      borderRadius: 12,
                      marginBottom: 8,
                      border: "1px solid var(--color-line)",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{h.store_url}</p>
                      <p style={{ fontSize: 12.5, color: "var(--color-muted)", marginTop: 2 }}>
                        {new Date(h.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {h.total_products} products
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: 16,
                        color: scoreColor(h.score),
                      }}
                    >
                      {h.score}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}