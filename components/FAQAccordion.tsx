"use client";

import { useState } from "react";

const FAQS: [string, string][] = [
  [
    "Do I need to install anything on my Shopify store?",
    "No. We read your store's public product data directly — no app install, no permissions, no admin access required. Just paste your storefront URL.",
  ],
  [
    "Does this change or modify anything on my store?",
    "No. Every check is read-only. We never write to your store, change listings, or touch your Shopify admin — we only read what's already publicly visible on your storefront.",
  ],
  [
    "How many products can you scan?",
    "Each audit scans up to 50 products from your store's public catalog. If your store has more, we recommend running an audit after your biggest catalog updates to catch what changed.",
  ],
  [
    "Where does my audit data go?",
    "If you're signed in, your results are saved to your account so you can track scores over time. We never share your store data with anyone else.",
  ],
  [
    "Can I cancel Pro anytime?",
    "Yes. Pro is billed monthly through PayPal and you can cancel anytime — no lock-in, no cancellation fee.",
  ],
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {FAQS.map(([question, answer], i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={question}
            style={{
              borderBottom: i < FAQS.length - 1 ? "1px solid var(--color-line)" : "none",
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                padding: "18px 4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-ink)",
              }}
            >
              {question}
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "1px solid #e4e4e7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "var(--color-muted)",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                +
              </span>
            </button>
            <div
              style={{
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <p
                  style={{
                    padding: "0 4px 18px",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--color-muted)",
                  }}
                >
                  {answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}