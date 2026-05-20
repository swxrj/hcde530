# Mini Project 1 — how this project came together

## Why this dataset and these questions

I picked the [Kaggle star dataset](https://www.kaggle.com/datasets/deepu1109/star-dataset?resource=download) because I care about space and astronomy, and I wanted practice turning a dense table into something you can actually read. The file has 240 stars with temperature, luminosity, radius, absolute magnitude, color, spectral class, and a type code from brown dwarf through hypergiant.

Early on I locked three questions and kept them through the whole project:

1. Which properties best separate star types?
2. Are larger stars always brighter, or does that depend on type?
3. Does color reliably point to temperature and type?

Those questions came from what I was curious about. They also connect to design thinking: people often judge stars by color and brightness, but the measurements underneath are messier than that.

## Starting with the table (`stars.csv` and pandas)

Before any charts, I needed to trust the data. I loaded `stars.csv` and ran the usual checks: `head()`, `info()`, `describe()`, and `isnull().sum()`. That work lives in **Section 2** of `mp1.ipynb`.

What I learned quickly: the file is clean (no missing values in the main columns), balanced across types, and the numbers span huge ranges—especially luminosity and radius. Mean values by star type jumped a lot for luminosity, which told me it would matter for question 1. A simple correlation between radius and luminosity was positive but not tight enough to treat “bigger = brighter” as a rule without looking at type. Color labels were spelled several ways (`Blue-white`, `Blue White`, etc.), so I knew question 3 would need cleanup before plotting.

That pandas pass was not flashy, but it shaped every chart that came later. I did not want visuals that only looked good.

## Building the three charts (`charts/`)

**Section 3** of `mp1.ipynb` holds one chart per question. The committed images are in `charts/`:

| File | Question |
|------|----------|
| `q1_type_separation.png` | Which properties separate types? |
| `q2_radius_luminosity.png` | Are larger stars always brighter? |
| `q3_color_temperature.png` | Does color match temperature and type? |

**Question 1 — heatmap (`q1_type_separation.png`).** I compared temperature, log luminosity, log radius, and absolute magnitude using z-scores so different units could sit on one scale.

- **Inference from the graph:** Supergiants and hypergiants sit high on luminosity and radius; brown, red, and white dwarfs sit low. Temperature shifts across types too, but not as cleanly—white dwarfs can be hot while still small and dim compared with giants. Absolute magnitude also separates types (brighter giants have lower/more negative Mv).
- **What I learned:** Star type in this dataset is not explained by one column. Luminosity and radius do the most work; you need several measurements together. Temperature alone would mislead you about type.

**Question 2 — log-log scatter (`q2_radius_luminosity.png`).** Radius and luminosity both cover many orders of magnitude, so a log-log scatter fit the question.

- **Inference from the graph:** Points trend up and to the right—larger radius generally goes with higher luminosity. The relationship is much tighter on log scales (correlation about 0.92 on log values vs about 0.53 on raw values). Clusters by star type show the rule is not universal: white dwarfs and giant classes do not follow one simple line.
- **What I learned:** “Bigger means brighter” is a fair first guess in this table, but only if you allow for star type. Raw-scale plots hide that because the brightest giants dominate; log scale makes the pattern and the exceptions easier to see.

**Question 3 — box plot by cleaned color (`q3_color_temperature.png`).** I normalized color strings before plotting so one category was not split into three spellings.

- **Inference from the graph:** Red-labeled stars cluster at lower temperatures; blue and blue-white groups sit higher (in this file, red averages around 3,300 K, blue around 22,000 K, blue-white around 16,600 K). Boxes still overlap, and some color groups have few rows—so the same color word does not always mean one narrow temperature or one star type.
- **What I learned:** Color matches the broad astronomy story (cool red, hot blue) and can steer you toward hotter or cooler, but it is not enough to assign type on its own. It works better alongside temperature, luminosity, radius, and spectral class.

## What worked and what did not

**Worked:** Sticking to the three questions from the start; profiling the CSV before plotting; log scales for luminosity and radius; cleaning color labels; exporting static PNGs so the analysis reads on GitHub without running Plotly.

**Did not work at first:** My first draft for question 1 was a faceted box plot with four metrics. In the notebook it was readable; as a static PNG the axis labels overlapped no matter how much I tweaked size and spacing. I switched to the heatmap for the same question—it answers it with less clutter. That was the main design pivot in the project.

Older exploratory plots from an early matplotlib pass are in `archive/legacy/` for reference only. They are not part of the final story.

## Pulling it into one place

`mp1.ipynb` is the full narrative: overview, data profile, analysis with the three charts, conclusions, and a short process section. `chart_justifications.md` notes why each chart type fits its question. Everything in this folder is meant to run on its own—same CSV, same chart paths, no digging through other weekly folders.

**Section 4** states what I would tell someone from this work: use several properties together for type, treat “bigger = brighter” as a tendency not a law, and treat color as directional help rather than a sole classifier.

## Tools along the way

I used Cursor for faster coding on repetitive pieces—loading the CSV, Plotly setup, Kaleido export paths, notebook layout. The questions, the filter ideas, the choice to clean colors, the call to replace the Q1 box plot with a heatmap, and the written interpretations were mine. I read the outputs and only kept charts I could explain in plain language.

If I had more time, I would try a simple model that combines luminosity, radius, and temperature to predict type, and compare that to using color alone.
