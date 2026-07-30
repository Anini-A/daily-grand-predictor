const TRANSLATIONS = {
  en: {
    page_title: "Daily Grand Predictor",
    header_updated: "auto-updated after every draw",

    h_ai_next_pick: "🎯 AI's next pick",
    h_lucky_numbers: "🍀 Your lucky numbers",
    h_how_ai_predicts: "🤖 How the AI predicts",
    h_forever_pick: "🔒 AI's forever pick",
    h_hot_cold: "🔥 Hot &amp; cold numbers",
    h_hot_pairs: "🤝 Hot pairs",
    h_honest_scorecard: "📊 Honest scorecard",
    h_chart_title: "Model vs. random baseline, per draw",
    h_history_title: "Draw history",

    explainer_p1: `Three machine-learning models &mdash; Random Forest, Gradient Boosting,
        and XGBoost &mdash; get blended into one prediction. Each looks at a
        different time horizon: the <strong>last 3 draws</strong> (recent form),
        the <strong>last 22 draws'</strong> average and spread (medium-term trend),
        and how <strong>overdue</strong> each number is based on its gap since it
        last appeared (long-term memory).`,
    explainer_p2: `Daily Grand is a fair, independent draw, so no model can
        find a real edge &mdash; the scorecard below proves it honestly. Consider
        this a fun extra, not a strategy.`,
    why_change_q: "Why do the predictions barely change?",
    why_change_a: `The models are trained to make their <strong>error</strong> as small as
        possible against real draws &mdash; and because a fair lottery has no pattern
        to learn, the safest low-error guess is simply the <em>average draw</em>.
        Across the 1,000+ draws on record the five numbers average out to roughly
        <strong>8, 17, 25, 33 and 42</strong>, with <strong>4</strong> the most common
        Grand Number. So the pick keeps landing near those values and only nudges a
        little as recent draws shift the averages. Predictions that barely move
        aren't a bug &mdash; they're the honest result of there being nothing to predict.`,
    pairs_hint: "Number pairs that have landed together in the same draw most often.",
    legend_model_hits: "Model hits",
    legend_random_baseline: "Random baseline",
    th_date: "Date",
    th_drawn: "Drawn",
    th_predicted: "Predicted",
    th_hits: "Hits",
    th_grand: "Grand",
    footer: "Data scraped from LotteryExtreme &middot; regenerated automatically after each draw",

    lucky_title_number: "Your lucky number",
    lucky_sub_number: "Drawn in {pct}% of all {n} draws &mdash; more than any other number.",
    lucky_title_grand: "Your lucky Grand Number",
    lucky_sub_grand: "Drawn in {pct}% of all {n} draws.",

    hotcold_hint: "Based on all {n} draws on record. Hot = drawn more often than average, cold = less.",
    pairs_together: "together {n}&times;",

    forever_analysis: "Built from the 5 main numbers with the strongest historical showing ({numbers}, each appearing {min}-{max} times across {n} draws) plus the most frequent Grand Number ({grand}). Daily Grand is a fair, independent draw, so this doesn't predict anything - but if you're committing to one combination forever, anchoring to historical frequency is at least a reasoned starting point rather than a totally arbitrary one.",

    hero_label: "Next predicted draw &mdash; {date}",
    hero_generated: "Generated {datetime}",
    hero_disclaimer: "Daily Grand is a fair, independent draw. This pick is for fun &mdash; see the honest scorecard below for how the model actually performs.",
    hero_empty: "No prediction available yet.",

    kpi_draws_audited: "Draws audited",
    kpi_model_avg: "Model avg match",
    kpi_chance_of: "chance: {v}/5",
    kpi_edge: "Edge over chance",
    kpi_z: "z = {v}",
    kpi_grand_hits: "Grand Number hits",
    kpi_chance: "chance: {v}",
    kpi_empty: "Not enough history to audit yet.",

    verdict_chance: "<strong>z = {z}</strong> &mdash; in plain terms, the AI is scoring right in line with random guessing. Picture this number as a needle: <strong>0 is pure luck</strong>, and it would have to reach <strong>2</strong> to signal any real skill. At {z} it's nowhere close &mdash; exactly what you'd expect from a fair lottery.",
    verdict_above: "<strong>z = {z}</strong> &mdash; the AI scored a little above random over this stretch, but with so few draws that's just a lucky run (it happens roughly 1 time in 40) and will drift back toward pure chance.",
    verdict_below: "<strong>z = {z}</strong> &mdash; the AI scored a little below random over this stretch. That's also just luck &mdash; for random picks an unlucky run is exactly as likely as a lucky one.",

    chart_empty: "No draws to chart yet.",
    chart_tooltip: "Model: {hits}/5 &middot; Random avg: {baseline}/5",
    history_empty: "No draws to show yet.",
    grand_hit: "🎯 Hit",
    grand_tip: "Predicted {pred}, drawn {act}",
    loading: "Loading&hellip;",
  },
  fr: {
    page_title: "Daily Grand Predictor",
    header_updated: "mis à jour après chaque tirage",

    h_ai_next_pick: "🎯 Le prochain choix de l'IA",
    h_lucky_numbers: "🍀 Vos numéros chanceux",
    h_how_ai_predicts: "🤖 Comment l'IA prédit",
    h_forever_pick: "🔒 Le choix éternel de l'IA",
    h_hot_cold: "🔥 Numéros chauds et froids",
    h_hot_pairs: "🤝 Paires chaudes",
    h_honest_scorecard: "📊 Bilan honnête",
    h_chart_title: "Modèle vs. base aléatoire, par tirage",
    h_history_title: "Historique des tirages",

    explainer_p1: `Trois modèles d'apprentissage automatique &mdash; Random Forest,
        Gradient Boosting et XGBoost &mdash; sont combinés en une seule
        prédiction. Chacun examine un horizon différent : les <strong>3 derniers
        tirages</strong> (tendance récente), la <strong>moyenne et l'écart des 22
        derniers tirages</strong> (tendance à moyen terme), et à quel point chaque
        numéro est <strong>en retard</strong> selon son écart depuis sa dernière
        apparition (mémoire à long terme).`,
    explainer_p2: `Daily Grand est un tirage équitable et indépendant, donc aucun
        modèle ne peut trouver un réel avantage &mdash; le bilan ci-dessous le
        prouve honnêtement. Considérez ceci comme un supplément amusant, pas
        une stratégie.`,
    why_change_q: "Pourquoi les prédictions changent-elles à peine ?",
    why_change_a: `Les modèles sont entraînés à rendre leur <strong>erreur</strong> la plus
        petite possible face aux vrais tirages &mdash; et comme une loterie équitable
        n'a aucun schéma à apprendre, la supposition la plus sûre est simplement le
        <em>tirage moyen</em>. Sur les 1 000+ tirages enregistrés, les cinq numéros
        se situent en moyenne autour de <strong>8, 17, 25, 33 et 42</strong>, avec
        <strong>4</strong> comme numéro Grand le plus fréquent. Le choix reste donc
        proche de ces valeurs et ne bouge qu'un peu quand les tirages récents
        déplacent les moyennes. Des prédictions quasi immobiles ne sont pas un bug
        &mdash; c'est le résultat honnête du fait qu'il n'y a rien à prédire.`,
    pairs_hint: "Paires de numéros sorties ensemble le plus souvent dans le même tirage.",
    legend_model_hits: "Coups du modèle",
    legend_random_baseline: "Base aléatoire",
    th_date: "Date",
    th_drawn: "Tirés",
    th_predicted: "Prédits",
    th_hits: "Coups",
    th_grand: "Grand",
    footer: "Données extraites de LotteryExtreme &middot; régénérées automatiquement après chaque tirage",

    lucky_title_number: "Votre numéro chanceux",
    lucky_sub_number: "Tiré dans {pct}% des {n} tirages &mdash; plus que tout autre numéro.",
    lucky_title_grand: "Votre numéro Grand chanceux",
    lucky_sub_grand: "Tiré dans {pct}% des {n} tirages.",

    hotcold_hint: "Basé sur les {n} tirages enregistrés. Chaud = tiré plus souvent que la moyenne, froid = moins souvent.",
    pairs_together: "ensemble {n}&times;",

    forever_analysis: "Construit à partir des 5 numéros principaux les plus fréquents historiquement ({numbers}, chacun apparu {min} à {max} fois sur {n} tirages) plus le numéro Grand le plus fréquent ({grand}). Daily Grand est un tirage équitable et indépendant, donc cela ne prédit rien - mais si vous devez miser sur une seule combinaison pour toujours, s'appuyer sur la fréquence historique est un point de départ plus réfléchi qu'un choix totalement arbitraire.",

    hero_label: "Prochain tirage prédit &mdash; {date}",
    hero_generated: "Généré le {datetime}",
    hero_disclaimer: "Daily Grand est un tirage équitable et indépendant. Ce choix est pour le plaisir &mdash; consultez le bilan honnête ci-dessous pour voir comment le modèle se comporte réellement.",
    hero_empty: "Aucune prédiction disponible pour le moment.",

    kpi_draws_audited: "Tirages analysés",
    kpi_model_avg: "Moyenne de coups du modèle",
    kpi_chance_of: "hasard : {v}/5",
    kpi_edge: "Avantage sur le hasard",
    kpi_z: "z = {v}",
    kpi_grand_hits: "Coups du numéro Grand",
    kpi_chance: "hasard : {v}",
    kpi_empty: "Pas encore assez d'historique pour analyser.",

    verdict_chance: "<strong>z = {z}</strong> &mdash; en clair, l'IA obtient exactement le même résultat qu'un choix au hasard. Voyez ce chiffre comme une aiguille : <strong>0 = pur hasard</strong>, et il faudrait atteindre <strong>2</strong> pour indiquer une réelle compétence. À {z}, on en est loin &mdash; précisément ce qu'on attend d'une loterie équitable.",
    verdict_above: "<strong>z = {z}</strong> &mdash; l'IA a fait un peu mieux que le hasard sur cette période, mais avec aussi peu de tirages ce n'est qu'un coup de chance (environ 1 fois sur 40) qui reviendra vers le pur hasard.",
    verdict_below: "<strong>z = {z}</strong> &mdash; l'IA a fait un peu moins bien que le hasard sur cette période. C'est aussi juste de la chance &mdash; pour des choix aléatoires, une mauvaise passe est aussi probable qu'une bonne.",

    chart_empty: "Aucun tirage à afficher pour le moment.",
    chart_tooltip: "Modèle : {hits}/5 &middot; Moyenne aléatoire : {baseline}/5",
    history_empty: "Aucun tirage à afficher pour le moment.",
    grand_hit: "🎯 Réussi",
    grand_tip: "Prédit {pred}, tiré {act}",
    loading: "Chargement&hellip;",
  },
};

function t(lang, key, vars) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
  }
  return str;
}

function getLang() {
  const stored = localStorage.getItem("dg_lang");
  if (stored === "en" || stored === "fr") return stored;
  return navigator.language && navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function setLang(lang) {
  localStorage.setItem("dg_lang", lang);
}

function localeFor(lang) {
  return lang === "fr" ? "fr-FR" : "en-US";
}

function applyStaticTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerHTML = t(lang, el.getAttribute("data-i18n"));
  });
  document.title = t(lang, "page_title");
  document.documentElement.lang = lang;
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}
