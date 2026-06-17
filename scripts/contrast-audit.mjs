// WCAG AA contrast audit — post-fix state.
const TOK = {
  ivory:    [250, 246, 240], // #FAF6F0
  sand:     [232, 219, 196], // #E8DBC4
  espresso: [43, 29, 20],    // #2B1D14
  amber:    [156, 90, 27],   // #9C5A1B (darkened)
};
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const over = (fg, a, bg) => fg.map((c, i) => a * c + (1 - a) * bg[i]);
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const need = { normal: 4.5, large: 3.0, ui: 3.0 };

// [label, fgToken, alpha, bgToken, sizeClass]
const cases = [
  // muted secondary text — now /0.7 on both backgrounds
  ["espresso/0.7 secondary on ivory",        "espresso", 0.7, "ivory", "normal"],
  ["espresso/0.7 secondary on sand",         "espresso", 0.7, "sand",  "normal"],
  ["espresso/0.7 placeholder on sand",       "espresso", 0.7, "sand",  "normal"],
  ["espresso/0.7 separator on sand (base)",  "espresso", 0.7, "sand",  "normal"],
  ["espresso/0.75 datetime on ivory",        "espresso", 0.75, "ivory", "normal"],
  ["espresso/1.0 heading on ivory",          "espresso", 1.0, "ivory", "normal"],
  ["espresso/1.0 StepSummary price on sand", "espresso", 1.0, "sand",  "normal"],

  // amber as text (prices) — large displays
  ["amber price text-3xl bold on sand",      "amber", 1.0, "sand",  "large"],
  ["amber price text-2xl bold on sand",      "amber", 1.0, "sand",  "large"],
  ["amber price text-xl bold on sand",       "amber", 1.0, "sand",  "large"],
  ["amber price text-2xl on ivory",          "amber", 1.0, "ivory", "large"],
  ["amber price text-xl on ivory",           "amber", 1.0, "ivory", "large"],

  // ivory text/icon on amber (buttons, selected pills)
  ["ivory on amber: btn text-base semibold", "ivory", 1.0, "amber", "normal"],
  ["ivory on amber: slot text-sm",           "ivory", 1.0, "amber", "normal"],
  ["ivory on amber: date num text-lg",       "ivory", 1.0, "amber", "normal"],
  ["ivory/1.0 on amber: selected weekday",   "ivory", 1.0, "amber", "normal"],

  // arrow chevron icon (graphical UI), desktop only
  ["espresso/0.7 chevron icon on sand",      "espresso", 0.7, "sand", "ui"],
];

let fails = 0;
for (const [label, fg, a, bg, size] of cases) {
  const comp = over(TOK[fg], a, TOK[bg]);
  const r = ratio(comp, TOK[bg]);
  const req = need[size];
  const ok = r >= req;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  (need ${req})  ${label}`);
}
console.log(`\n${fails} failing combination(s).`);
