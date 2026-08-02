import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

type Flag = {
  flag: string;
  suggestion: string;
};

const FREE_MONTHLY_AUDIT_LIMIT = 3;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // --- Free-tier enforcement ---
  // Check Pro status first; only count against the limit if the user
  // isn't Pro, since Pro is unlimited.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  const isPro = subscription?.status === "active";

  if (!isPro) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (countError) {
      console.error("Failed to check audit count:", countError.message);
      // Fail open rather than blocking a paying customer's flow over a
      // transient DB read error — but log it for visibility.
    } else if ((count ?? 0) >= FREE_MONTHLY_AUDIT_LIMIT) {
      return NextResponse.json(
        {
          error: `You've used all ${FREE_MONTHLY_AUDIT_LIMIT} free audits this month. Upgrade to Pro for unlimited audits.`,
          limitReached: true,
        },
        { status: 403 }
      );
    }
  }

  const { url } = await req.json();

  let storeUrl = url.trim().replace(/\/$/, "");
  if (!storeUrl.startsWith("http")) {
    storeUrl = "https://" + storeUrl;
  }

  try {
    const res = await fetch(`${storeUrl}/products.json?limit=50`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Couldn't reach that store. Check the URL and try again." },
        { status: 400 }
      );
    }

    const data = await res.json();
    const products = data.products || [];
    const seenTitles = new Map<string, number>();

    const analyzed = products.map((p: any) => {
      const flags: Flag[] = [];
      const description = (p.body_html || "").replace(/<[^>]*>/g, "").trim();

      if (/lorem ipsum|TODO|placeholder text/i.test(description)) {
        flags.push({
          flag: "Description contains placeholder text",
          suggestion:
            "Replace the placeholder text with real product copy — mention materials, key features, and what makes it worth buying.",
        });
      }

      const allOutOfStock =
        p.variants && p.variants.length > 0 && p.variants.every((v: any) => v.available === false);
      if (allOutOfStock) {
        flags.push({
          flag: "Out of stock (all variants)",
          suggestion:
            "Restock soon or hide this listing — an out-of-stock product still showing in search hurts conversion rate and wastes ad spend if you're running traffic to it.",
        });
      }

      const missingWeight =
        p.variants && p.variants.length > 0 && p.variants.every((v: any) => !v.grams || v.grams === 0);
      if (missingWeight) {
        flags.push({
          flag: "Missing weight — may cause shipping issues",
          suggestion:
            "Add a weight to each variant in Shopify admin. Without it, real-time carrier shipping rates can't calculate correctly, which can undercharge or overcharge customers at checkout.",
        });
      }

      if (p.handle && /^\d+$/.test(p.handle.replace(/-/g, ""))) {
        flags.push({
          flag: "Product URL looks auto-generated (bad for SEO)",
          suggestion: `Edit the URL handle in Shopify admin to include descriptive keywords, e.g. "${(p.title || "product-name")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}" instead of numbers.`,
        });
      }

      if (!description) {
        flags.push({
          flag: "Missing description",
          suggestion:
            "Write at least 2-3 sentences covering what the product is, who it's for, and one standout feature or benefit. Empty descriptions hurt both SEO and conversion.",
        });
      } else if (description.length < 100) {
        flags.push({
          flag: "Description too thin",
          suggestion: `Expand from ${description.length} characters to at least 150-300. Add details like materials, dimensions, use cases, or care instructions.`,
        });
      }

      if (!p.title || p.title.length < 10) {
        flags.push({
          flag: "Title may be too short",
          suggestion:
            "Add a defining detail — brand, material, or key feature — so the title stands on its own in search results and collection pages.",
        });
      }
      if (p.title && p.title.length > 70) {
        const trimmed = p.title.slice(0, 67).trim() + "...";
        flags.push({
          flag: "Title too long for search results (SEO)",
          suggestion: `Google typically truncates around 60-70 characters. Consider shortening to something like: "${trimmed}"`,
        });
      }
      if (!p.product_type) {
        flags.push({
          flag: "Missing product category/type",
          suggestion:
            "Set a Product Type in Shopify admin (e.g. \"T-Shirts\", \"Skincare\"). It powers collection filtering and helps Shopify's own search relevance.",
        });
      }
      if (!p.vendor) {
        flags.push({
          flag: "Missing vendor/brand info",
          suggestion:
            "Add a vendor name in Shopify admin, even if it's your own store name — it's used for filtering and can matter for multi-brand storefronts.",
        });
      }
      if (!p.tags) {
        flags.push({
          flag: "No tags set",
          suggestion:
            "Add 3-5 tags describing material, use case, style, or collection — helps with on-site search, filtering, and automated collections.",
        });
      }

      const key = (p.title || "").toLowerCase().trim();
      if (key) {
        seenTitles.set(key, (seenTitles.get(key) || 0) + 1);
      }

      if (!p.images || p.images.length === 0) {
        flags.push({
          flag: "No product images",
          suggestion:
            "Add at least one high-quality image. Listings without images convert dramatically worse and often get suppressed in search.",
        });
      } else {
        const missingAlt = p.images.filter((img: any) => !img.alt || img.alt.trim() === "");
        if (missingAlt.length > 0) {
          flags.push({
            flag: `${missingAlt.length} image(s) missing alt text (bad for SEO)`,
            suggestion: `Add descriptive alt text to ${missingAlt.length} image(s) in Shopify admin — e.g. "${p.title || "product"} - front view". Helps with image search traffic and accessibility.`,
          });
        }
        if (p.images.length === 1) {
          flags.push({
            flag: "Only 1 image — consider adding more angles",
            suggestion:
              "Add 3-5 more images: different angles, close-ups of materials/details, and a lifestyle/in-use shot. Multiple images reliably improve conversion rate.",
          });
        }
      }

      const variant = p.variants?.[0];
      const price = parseFloat(variant?.price || "0");
      const compareAt = parseFloat(variant?.compare_at_price || "0");

      if (price === 0) {
        flags.push({
          flag: "Price missing or zero",
          suggestion:
            "Set a real price for this variant in Shopify admin — a $0 price will either block checkout or let customers get the item for free.",
        });
      }
      if (compareAt > 0 && compareAt <= price) {
        flags.push({
          flag: "Compare-at price isn't actually a discount",
          suggestion: `Compare-at price ($${compareAt}) should be higher than the actual price ($${price}) to show a real discount — otherwise remove the compare-at price so no strikethrough shows.`,
        });
      }
      if (p.variants && p.variants.length > 1) {
        const prices = p.variants.map((v: any) => parseFloat(v.price || "0"));
        const allSame = prices.every((pr: number) => pr === prices[0]);
        if (!allSame && Math.max(...prices) - Math.min(...prices) > Math.min(...prices) * 2) {
          flags.push({
            flag: "Large price gap between variants — double check pricing",
            suggestion: `Variant prices range from $${Math.min(...prices)} to $${Math.max(...prices)}. Confirm this is intentional (e.g. size-based pricing) and not a data entry error.`,
          });
        }
      }

      return {
        title: p.title,
        price,
        flags,
      };
    });

    const final = analyzed.map((p: any) => {
      const key = (p.title || "").toLowerCase().trim();
      if (key && (seenTitles.get(key) || 0) > 1) {
        return {
          ...p,
          flags: [
            ...p.flags,
            {
              flag: "Duplicate or near-duplicate title",
              suggestion:
                "Differentiate the title — mention size, color, bundle size, or variant so customers and search engines can tell listings apart.",
            },
          ],
        };
      }
      return p;
    });

    const maxFlagsPerProduct = 6;
    const totalPossible = final.length * maxFlagsPerProduct;
    const totalFlags = final.reduce((sum: number, p: any) => sum + p.flags.length, 0);
    const rawScore = totalPossible > 0 ? 10 - (totalFlags / totalPossible) * 10 : 10;
    const score = Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10));

    const cleanCount = final.filter((p: any) => p.flags.length === 0).length;

    const { error: dbError } = await supabase.from("audits").insert({
      user_id: userId,
      store_url: storeUrl,
      score,
      total_products: final.length,
      clean_count: cleanCount,
      products: final,
    });

    if (dbError) {
      console.error("Failed to save audit:", dbError.message);
    }

    return NextResponse.json({
      products: final,
      score,
      totalProducts: final.length,
      cleanCount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong reaching that store." },
      { status: 500 }
    );
  }
}