async function loadJSON(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function ballHTML(n, hit, grand) {
  const cls = ["ball"];
  if (grand) cls.push("grand");
  return `<div class="${cls.join(" ")}">${n}</div>`;
}

function renderLucky(lang, stats) {
  const el = document.getElementById("lucky");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">${t(lang, "loading")}</div>`;
    return;
  }
  el.innerHTML = `
    <div class="lucky-row">
      <div class="lucky-item">
        <div class="ball lucky-ball">${stats.lucky_number}</div>
        <div class="lucky-copy">
          <div class="lucky-title">${t(lang, "lucky_title_number")}</div>
          <div class="lucky-sub">${t(lang, "lucky_sub_number", { pct: stats.lucky_number_pct, n: stats.draws_analyzed.toLocaleString(localeFor(lang)) })}</div>
        </div>
      </div>
      <div class="lucky-item">
        <div class="ball lucky-ball grand">${stats.lucky_grand}</div>
        <div class="lucky-copy">
          <div class="lucky-title">${t(lang, "lucky_title_grand")}</div>
          <div class="lucky-sub">${t(lang, "lucky_sub_grand", { pct: stats.lucky_grand_pct, n: stats.draws_analyzed.toLocaleString(localeFor(lang)) })}</div>
        </div>
      </div>
    </div>
  `;
}

function renderHotCold(lang, stats) {
  const el = document.getElementById("hotcold");
  const hint = document.getElementById("hotcold-hint");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">${t(lang, "loading")}</div>`;
    return;
  }
  hint.innerHTML = t(lang, "hotcold_hint", { n: stats.draws_analyzed.toLocaleString(localeFor(lang)) });

  const chipRow = (items, cls) => items.map((it) => `
    <div class="chip ${cls}">
      <span class="chip-n">${it.number}</span>
      <span class="chip-count">${it.count}&times;</span>
    </div>
  `).join("");

  el.innerHTML = `
    <div class="hotcold-group">
      <div class="hotcold-label hot">🔥 Hot</div>
      <div class="chip-row">${chipRow(stats.hot_numbers, "hot")}</div>
    </div>
    <div class="hotcold-group">
      <div class="hotcold-label cold">❄️ Cold</div>
      <div class="chip-row">${chipRow(stats.cold_numbers, "cold")}</div>
    </div>
  `;
}

function renderPairs(lang, stats) {
  const el = document.getElementById("pairs");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">${t(lang, "loading")}</div>`;
    return;
  }
  el.innerHTML = stats.hot_pairs.map((p, i) => `
    <div class="pair-row">
      <span class="pair-rank">#${i + 1}</span>
      <span class="pair-nums">
        <span class="n hit">${p.numbers[0]}</span>
        <span class="pair-plus">+</span>
        <span class="n hit">${p.numbers[1]}</span>
      </span>
      <span class="pair-count">${t(lang, "pairs_together", { n: p.count })}</span>
    </div>
  `).join("");
}

function renderForever(lang, stats) {
  const el = document.getElementById("forever");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">${t(lang, "loading")}</div>`;
    return;
  }
  const pick = stats.forever_pick;
  const sortedNumbers = [...pick.numbers].sort((a, b) => a - b);
  const analysis = t(lang, "forever_analysis", {
    numbers: sortedNumbers.join(", "),
    min: Math.min(...pick.counts),
    max: Math.max(...pick.counts),
    n: stats.draws_analyzed.toLocaleString(localeFor(lang)),
    grand: pick.grand_number,
  });
  el.innerHTML = `
    <div class="forever-row">
      ${sortedNumbers.map((n) => `<div class="ball forever-ball">${n}</div>`).join("")}
      <div class="ball forever-ball grand">${pick.grand_number}</div>
    </div>
    <p class="forever-analysis">${analysis}</p>
  `;
}

function renderHero(lang, prediction) {
  const el = document.getElementById("hero");
  if (!prediction) {
    el.innerHTML = `<div class="empty-state">${t(lang, "hero_empty")}</div>`;
    return;
  }
  const dateLabel = new Date(prediction.target_date + "T00:00:00").toLocaleDateString(localeFor(lang), {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const generatedLabel = new Date(prediction.generated_at).toLocaleString(localeFor(lang));
  el.innerHTML = `
    <div class="label">${t(lang, "hero_label", { date: dateLabel })}</div>
    <div class="balls">
      ${prediction.numbers.map((n) => ballHTML(n, false, false)).join("")}
      ${ballHTML(prediction.grand_number, false, true)}
    </div>
    <div class="date">${t(lang, "hero_generated", { datetime: generatedLabel })}</div>
    <div class="disclaimer">${t(lang, "hero_disclaimer")}</div>
  `;
}

function renderKpis(lang, audit) {
  const el = document.getElementById("kpis");
  if (!audit || audit.draws_audited == null) {
    el.innerHTML = `<div class="empty-state">${t(lang, "kpi_empty")}</div>`;
    document.getElementById("verdict").textContent = "";
    return;
  }
  const rows = [
    [t(lang, "kpi_draws_audited"), audit.draws_audited, ""],
    [t(lang, "kpi_model_avg"), `${audit.model_avg_match}/5`, t(lang, "kpi_chance_of", { v: audit.theoretical_chance })],
    [t(lang, "kpi_edge"), `${audit.edge_over_chance >= 0 ? "+" : ""}${audit.edge_over_chance}`, t(lang, "kpi_z", { v: audit.z_score })],
    [t(lang, "kpi_grand_hits"), `${audit.grand_hits}/${audit.draws_audited}`, t(lang, "kpi_chance", { v: audit.grand_hits_chance })],
  ];
  el.innerHTML = rows.map(([label, value, sub]) => `
    <div class="kpi">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ""}
    </div>
  `).join("");

  const verdictKey = { chance: "verdict_chance", above: "verdict_above", below: "verdict_below" }[audit.verdict_key];
  document.getElementById("verdict").textContent = verdictKey ? t(lang, verdictKey, { z: audit.z_score }) : "";
}

function renderChart(lang, audit) {
  const container = document.getElementById("chart");
  const tooltip = document.getElementById("tooltip");
  if (!audit || !audit.history || !audit.history.length) {
    container.innerHTML = `<div class="empty-state">${t(lang, "chart_empty")}</div>`;
    return;
  }

  const history = [...audit.history].reverse(); // chronological
  const w = container.clientWidth || 680;
  const h = 140;
  const padL = 22, padR = 4, padT = 10, padB = 20;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const n = history.length;
  const groupW = plotW / n;
  const barW = Math.min(10, groupW / 3);
  const maxY = 5;

  const yScale = (v) => padT + plotH - (v / maxY) * plotH;

  let svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`;
  [0, 1, 2, 3, 4, 5].forEach((v) => {
    const y = yScale(v);
    svg += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" />`;
  });
  svg += `<line class="axis-line" x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" />`;

  history.forEach((d, i) => {
    const cx = padL + groupW * i + groupW / 2;
    const modelY = yScale(d.model_hits);
    const baseY = yScale(d.random_baseline);
    svg += `<rect class="bar-baseline" x="${cx - barW - 1}" y="${baseY}" width="${barW}" height="${padT + plotH - baseY}" rx="2" />`;
    svg += `<rect class="bar-model" x="${cx + 1}" y="${modelY}" width="${barW}" height="${padT + plotH - modelY}" rx="2" />`;
    svg += `<rect data-i="${i}" class="hit-target" x="${padL + groupW * i}" y="${padT}" width="${groupW}" height="${plotH}" fill="transparent" style="cursor:pointer" />`;
  });
  svg += `</svg>`;
  container.innerHTML = svg;

  container.querySelectorAll(".hit-target").forEach((rect) => {
    const d = history[+rect.dataset.i];
    rect.addEventListener("mouseenter", () => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `<strong>${d.date}</strong><br>${t(lang, "chart_tooltip", { hits: d.model_hits, baseline: d.random_baseline })}`;
    });
    rect.addEventListener("mousemove", (e) => {
      tooltip.style.left = `${e.pageX + 12}px`;
      tooltip.style.top = `${e.pageY + 12}px`;
    });
    rect.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}

function renderHistory(lang, audit) {
  const el = document.getElementById("history-body");
  const draws = audit && audit.recent_draws;
  if (!draws || !draws.length) {
    el.innerHTML = `<tr><td class="empty-state">${t(lang, "history_empty")}</td></tr>`;
    return;
  }
  el.innerHTML = draws.map((d) => {
    const hasPrediction = Array.isArray(d.predicted);
    const drawnSet = new Set(d.drawn);
    const predSet = hasPrediction ? new Set(d.predicted) : new Set();
    const drawnHtml = d.drawn.map((x) => `<span class="n ${predSet.has(x) ? "hit" : ""}">${x}</span>`).join("");
    const predHtml = hasPrediction
      ? d.predicted.map((x) => `<span class="n ${drawnSet.has(x) ? "hit" : ""}">${x}</span>`).join("")
      : `<span class="empty-state">&mdash;</span>`;
    const hits = hasPrediction ? `${d.model_hits}/5` : "&mdash;";
    const grandBadge = d.grand_hit
      ? `<span class="grand-badge hit">${t(lang, "grand_hit")}</span>`
      : `<span class="grand-badge miss">&mdash;</span>`;
    const grand = hasPrediction
      ? `${grandBadge}<span class="grand-compare">(${d.grand_predicted} vs ${d.grand_actual})</span>`
      : `${d.grand_actual}`;
    return `
      <tr>
        <td>${d.date}</td>
        <td><div class="nums">${drawnHtml}</div></td>
        <td><div class="nums">${predHtml}</div></td>
        <td class="hit-count">${hits}</td>
        <td>${grand}</td>
      </tr>
    `;
  }).join("");
}

let _prediction = null, _audit = null, _stats = null;

function renderAll(lang) {
  applyStaticTranslations(lang);
  renderLucky(lang, _stats);
  renderForever(lang, _stats);
  renderHotCold(lang, _stats);
  renderPairs(lang, _stats);
  renderHero(lang, _prediction);
  renderKpis(lang, _audit);
  renderChart(lang, _audit);
  renderHistory(lang, _audit);
}

async function main() {
  [_prediction, _audit, _stats] = await Promise.all([
    loadJSON("data/prediction.json"),
    loadJSON("data/audit.json"),
    loadJSON("data/stats.json"),
  ]);

  let lang = getLang();
  renderAll(lang);

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      lang = btn.dataset.lang;
      setLang(lang);
      renderAll(lang);
    });
  });
}

main();
