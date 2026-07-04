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

function renderLucky(stats) {
  const el = document.getElementById("lucky");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">Loading&hellip;</div>`;
    return;
  }
  el.innerHTML = `
    <div class="lucky-row">
      <div class="lucky-item">
        <div class="ball lucky-ball">${stats.lucky_number}</div>
        <div class="lucky-copy">
          <div class="lucky-title">Your lucky number</div>
          <div class="lucky-sub">Drawn in ${stats.lucky_number_pct}% of all ${stats.draws_analyzed.toLocaleString()} draws &mdash; more than any other number.</div>
        </div>
      </div>
      <div class="lucky-item">
        <div class="ball lucky-ball grand">${stats.lucky_grand}</div>
        <div class="lucky-copy">
          <div class="lucky-title">Your lucky Grand Number</div>
          <div class="lucky-sub">Drawn in ${stats.lucky_grand_pct}% of all ${stats.draws_analyzed.toLocaleString()} draws.</div>
        </div>
      </div>
    </div>
  `;
}

function renderHotCold(stats) {
  const el = document.getElementById("hotcold");
  const counter = document.getElementById("draws-analyzed");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">Loading&hellip;</div>`;
    return;
  }
  counter.textContent = stats.draws_analyzed.toLocaleString();

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

function renderPairs(stats) {
  const el = document.getElementById("pairs");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">Loading&hellip;</div>`;
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
      <span class="pair-count">together ${p.count}&times;</span>
    </div>
  `).join("");
}

function renderForever(stats) {
  const el = document.getElementById("forever");
  if (!stats) {
    el.innerHTML = `<div class="empty-state">Loading&hellip;</div>`;
    return;
  }
  const pick = stats.forever_pick;
  el.innerHTML = `
    <div class="forever-row">
      ${pick.numbers.map((n) => `<div class="ball forever-ball">${n}</div>`).join("")}
      <div class="ball forever-ball grand">${pick.grand_number}</div>
    </div>
    <p class="forever-analysis">${pick.analysis}</p>
  `;
}

function renderHero(prediction) {
  const el = document.getElementById("hero");
  if (!prediction) {
    el.innerHTML = `<div class="empty-state">No prediction available yet.</div>`;
    return;
  }
  const dateLabel = new Date(prediction.target_date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  el.innerHTML = `
    <div class="label">Next predicted draw &mdash; ${dateLabel}</div>
    <div class="balls">
      ${prediction.numbers.map((n) => ballHTML(n, false, false)).join("")}
      ${ballHTML(prediction.grand_number, false, true)}
    </div>
    <div class="date">Generated ${new Date(prediction.generated_at).toLocaleString()}</div>
    <div class="disclaimer">Daily Grand is a fair, independent draw. This pick is for fun &mdash;
      see the honest scorecard below for how the model actually performs.</div>
  `;
}

function renderKpis(audit) {
  const el = document.getElementById("kpis");
  if (!audit || audit.draws_audited == null) {
    el.innerHTML = `<div class="empty-state">Not enough history to audit yet.</div>`;
    return;
  }
  const rows = [
    ["Draws audited", audit.draws_audited, ""],
    ["Model avg match", `${audit.model_avg_match}/5`, `chance: ${audit.theoretical_chance}/5`],
    ["Edge over chance", `${audit.edge_over_chance >= 0 ? "+" : ""}${audit.edge_over_chance}`, `z = ${audit.z_score}`],
    ["Grand Number hits", `${audit.grand_hits}/${audit.draws_audited}`, `chance: ${audit.grand_hits_chance}`],
  ];
  el.innerHTML = rows.map(([label, value, sub]) => `
    <div class="kpi">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ""}
    </div>
  `).join("");

  document.getElementById("verdict").textContent = audit.verdict;
}

function renderChart(audit) {
  const container = document.getElementById("chart");
  const tooltip = document.getElementById("tooltip");
  if (!audit || !audit.history || !audit.history.length) {
    container.innerHTML = `<div class="empty-state">No draws to chart yet.</div>`;
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
    rect.addEventListener("mouseenter", (e) => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `<strong>${d.date}</strong><br>Model: ${d.model_hits}/5 &middot; Random avg: ${d.random_baseline}/5`;
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

function renderHistory(audit) {
  const el = document.getElementById("history-body");
  const draws = audit && audit.recent_draws;
  if (!draws || !draws.length) {
    el.innerHTML = `<tr><td class="empty-state">No draws to show yet.</td></tr>`;
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
    const grand = hasPrediction
      ? `${d.grand_hit ? "✓" : "—"} (${d.grand_predicted} vs ${d.grand_actual})`
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

async function main() {
  const [prediction, audit, stats] = await Promise.all([
    loadJSON("data/prediction.json"),
    loadJSON("data/audit.json"),
    loadJSON("data/stats.json"),
  ]);
  renderLucky(stats);
  renderForever(stats);
  renderHotCold(stats);
  renderPairs(stats);
  renderHero(prediction);
  renderKpis(audit);
  renderChart(audit);
  renderHistory(audit);
}

main();
