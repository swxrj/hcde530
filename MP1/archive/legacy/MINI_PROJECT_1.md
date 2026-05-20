# Mini Project 1 — Kaggle star dataset

## Dataset

- **Source:** [Star Dataset on Kaggle](https://www.kaggle.com/datasets/deepu1109/star-dataset?resource=download) (publisher: deepu1109).
- **Local copy:** `stars.csv` in this folder (same table as used elsewhere in the repo under `Week 5/stars.csv`).
- **Columns:** `Temperature (K)`, `Luminosity(L/Lo)`, `Radius(R/Ro)`, `Absolute magnitude(Mv)`, `Star type` (integer code), `Star color` (text), `Spectral Class` (letter).
- **Shape (typical):** 240 rows, 7 columns; 40 rows per star type (0–5), no missing values in the copies checked for this work.

## Star type codes

| Code | Label         |
|-----:|---------------|
| 0    | Brown Dwarf   |
| 1    | Red Dwarf     |
| 2    | White Dwarf   |
| 3    | Main Sequence |
| 4    | Supergiant    |
| 5    | Hypergiant    |

## Three analytical questions

1. **Which star properties are most useful for telling star types apart?**  
   Compare temperature, luminosity, radius, and absolute magnitude across star types to see which measurements show the biggest differences between categories.

2. **Are larger stars always brighter, or does the relationship change by star type?**  
   Look at how radius, luminosity, and absolute magnitude relate to each other, and whether some types break the idea that bigger means brighter.

3. **Does a star’s color reliably indicate its temperature and type?**  
   Compare star color with temperature, spectral class, and star type to see whether color is a dependable signal or whether overlaps and messy labels limit what you can infer.

## Why these questions matter

Stars become easier to reason about when you connect observables (brightness, color, size proxies) to temperature and evolutionary stage. The project is also practice at turning a dense table into summaries and visuals that make the patterns clear.

## Current progress

The project has moved from basic pandas summaries in Week 5 to assignment-ready static visualizations in Week 6. The Week 6 work keeps the same three questions, but now each question has a chart that can go into the MP1 analysis section.

The final Week 6 chart files are saved in `Week 6/charts_static/`:

| Chart | Question | What it shows |
|------|----------|---------------|
| `q1_type_separation.png` | Which properties best separate star types? | A standardized heatmap compares temperature, log luminosity, log radius, and absolute magnitude across star types. |
| `q2_radius_luminosity.png` | Are larger stars always brighter? | A log-log scatter plot compares radius and luminosity, with star type shown by color. |
| `q3_color_temperature.png` | Does color reliably indicate temperature and type? | A box plot compares temperature ranges across cleaned star color labels, with star type shown by color. |

## Updated findings from Week 6

- **Star type is best explained with multiple properties.** Luminosity and radius separate the types especially well, especially when shown on a log scale. Temperature helps, but by itself it is not enough. For example, white dwarfs can be hot while still being small and much less luminous than giant stars.
- **Bigger stars are usually brighter in this dataset, but it is not a perfect rule.** The radius-luminosity scatter has a strong upward pattern on the log-log chart. The Week 6 write-up reports a log-transformed correlation of about **0.918**, compared with about **0.527** on the raw values. The log view is better because radius and luminosity span huge ranges.
- **Color is useful, but only as a rough clue.** After cleaning repeated color labels, red stars are cooler on average, while blue and blue-white stars are hotter on average. The Week 6 notes list red stars around **3292 K**, blue stars around **21918 K**, and blue-white stars around **16660 K**. There is still overlap, so color alone should not be treated as a full classifier.

## Data cleaning and chart decisions

The Week 6 visuals use the same CSV from `Week 5/stars.csv`. Before plotting, the code:

1. Maps numeric `Star type` codes into readable labels.
2. Cleans repeated `Star color` spellings, such as `Blue-white`, `Blue White`, and `Blue white`.
3. Creates log10 versions of luminosity and radius so smaller and larger stars can be compared on the same chart.

The first version of the Q1 chart was a faceted box plot, but it became cluttered when exported as a static image. The final version uses a standardized heatmap instead. That was a better fit because it compares several properties at once without unreadable labels.

## Files and roles

| File | Role |
|------|------|
| `Week 5/stars.csv` | Main dataset used for the Week 5 and Week 6 work |
| `Week 5/week5_stars_analysis.py` | Pandas-first analysis script |
| `Week 5/week5_stars_analysis.ipynb` | Notebook version of the Week 5 analysis |
| `Week 5/week5.md` | Short Week 5 write-up and early takeaways |
| `Week 6/week6_stars_visuals.py` | Script that prepares the data, creates Plotly charts, writes HTML previews, and exports static PNGs |
| `Week 6/week6_stars_visuals.ipynb` | Earlier interactive Plotly notebook |
| `Week 6/week6_mp1_full.ipynb` | Fuller Week 6 notebook for MP1 |
| `Week 6/week6.md` | Week 6 progress write-up and chart interpretations |
| `Week 6/chart_justifications.md` | Short explanation of why each chart type fits its question |
| `Week 6/charts_static/q1_type_separation.png` | Static chart for Question 1 |
| `Week 6/charts_static/q2_radius_luminosity.png` | Static chart for Question 2 |
| `Week 6/charts_static/q3_color_temperature.png` | Static chart for Question 3 |

## How to rerun the Week 6 charts

From the repo root, use the Python environment that has `pandas`, `numpy`, `plotly`, and Kaleido installed:

```bash
python3 "Week 6/week6_stars_visuals.py"
```

The script writes interactive HTML previews to `Week 6/outputs/` and static assignment images to `Week 6/charts_static/`.

## Next step for MP1

For MP1b, the three Week 6 PNGs can become the start of the Analysis section. The next writing step is to place each chart near the matching research question and add a short interpretation under it: what the chart shows, what the answer is, and what limitation remains.
