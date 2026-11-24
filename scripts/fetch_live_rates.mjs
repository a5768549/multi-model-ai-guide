#!/usr/bin/env node
/**
 * Fetches live GA text model rates from the Wanyra public catalog and prints
 * a clean Markdown pricing table (CNY 1 = 1,000 points, exact unrounded CNY).
 */

const CATALOG_URL = "https://api.star1age.cn/api/portal/public-api/catalog";

function exactYuan(pts) {
  return `¥${Number((pts / 1000).toFixed(6))}`;
}

async function main() {
  const res = await fetch(CATALOG_URL, { headers: { "User-Agent": "multi-model-ai-guide/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const textModels = (data.models ?? []).filter(
    (m) => m.endpoint === "text" && m.status === "ga" && m.displayName && !/internal/i.test(m.displayName),
  );

  console.log("| Model | Model ID | Input / 1M | Output / 1M | Discount |");
  console.log("| --- | --- | ---: | ---: | --- |");
  for (const m of textModels) {
    const b = m.pricing?.[0]?.dimensions?.billing;
    const inp = b?.components?.find((c) => c.meter === "input_tokens");
    const out = b?.components?.find((c) => c.meter === "output_tokens");
    if (!inp || !out) continue;
    const inPts = (Number(inp.points) * 1e6) / Number(inp.basis);
    const outPts = (Number(out.points) * 1e6) / Number(out.basis);
    const mult = Number(b?.priceMultiplier);
    const disc = Number(b?.discountRate);
    const ratio = mult > 0 ? mult : disc > 0 ? (disc > 1 ? disc / 10 : disc) : 1;
    const vs = ratio < 1 ? `${Math.round((1 - ratio) * 100)}% off` : "List price";
    const name = m.displayName.replace(/\s*\([^)]*\)\s*$/, "");
    console.log(`| ${name} | \`${m.id}\` | ${exactYuan(inPts)} | ${exactYuan(outPts)} | ${vs} |`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
