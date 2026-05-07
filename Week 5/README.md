# Star dataset mini-project

A small data project using the [Kaggle Star Dataset](https://www.kaggle.com/datasets/deepu1109/star-dataset?resource=download) to explore how measurable stellar properties relate to star classification and to each other—turning tabular astronomy data into clear comparisons and visuals.

## Dataset

- **Source:** [Star Dataset on Kaggle](https://www.kaggle.com/datasets/deepu1109/star-dataset?resource=download) (publisher: deepu1109).
- **Local file:** `stars.csv` in this folder.
- **Columns:** Temperature (K), Luminosity (L/L☉), Radius (R/R☉), Absolute magnitude (Mv), Star type, Star color, Spectral Class.
- **Workflow:** Download the CSV from Kaggle, load it in a Jupyter notebook with pandas, then compare patterns across star categories with summaries, plots, and (optionally) interactive or more artistic views.

## Analytical questions

### 1. Which star properties are most useful for telling star types apart?

Compare temperature, luminosity, radius, and absolute magnitude across star types to see which measurements show the largest differences between categories and which best separate types visually or statistically (for example, grouped summaries, spread within types, or simple separation in plots).

### 2. Are larger stars always brighter, or does the relationship change by star type?

Examine how radius, luminosity, and absolute magnitude relate to each other overall and within each star type, and identify where the intuition that “bigger means brighter” holds versus where it breaks down.

### 3. Does a star’s color reliably indicate its temperature and type?

Compare star color with temperature, spectral class, and star type to see whether color is a dependable signal or whether overlaps and exceptions limit how far you can infer temperature or type from color alone.

## Why this project

Space and astronomy motivate the questions: stars become more tangible when you connect what we observe (brightness, color, size proxies) to physical ideas like temperature and evolutionary stage. The project is also practice at taking dense scientific data and shaping it into comparisons and visuals—interactive where it helps, and possibly more expressive or artistic presentations—that make the patterns easier for a broader audience to grasp.

## Artifacts

- **Pandas analysis (Week 5 / A5):** `week5_stars_analysis.py` — loads `stars.csv`, runs `head()`, `info()`, `isnull().sum()`, `value_counts()`, a boolean filter, and `groupby(...).mean()`, with plain-English comments above each block. Run from the `Week 5` folder: `../.venv/bin/python week5_stars_analysis.py`
- **Course demo notebooks (separate from this star project):** `week5_pandas_demo.ipynb`, `week5_merge_demo.ipynb`, `week5_atnf_pulsar_explore.ipynb`
