# Week 5 / A5 — Pandas analysis on the Kaggle star dataset (stars.csv)
# Run from repo root or from this folder:
#   cd Week 5 && ../.venv/bin/python week5_stars_analysis.py

from pathlib import Path

import pandas as pd

# Resolve stars.csv next to this script so paths work no matter where you run from.
DATA_PATH = Path(__file__).resolve().parent / "stars.csv"

# Human-readable names for the numeric Star type codes in the CSV.
STAR_TYPE_LABELS = {
    0: "Brown Dwarf",
    1: "Red Dwarf",
    2: "White Dwarf",
    3: "Main Sequence",
    4: "Supergiant",
    5: "Hypergiant",
}


def main() -> None:
    df = pd.read_csv(DATA_PATH)

    # ------------------------------------------------------------------
    # Question A — What does the raw table look like, and did it load cleanly?
    # I am asking: do we have the columns we expect, sensible dtypes, and a
    # quick sanity check on the first rows before we trust any summaries.
    # The answer means: if shapes and dtypes look wrong, we stop and fix the
    # file or the read step instead of interpreting bad numbers as astronomy.
    # ------------------------------------------------------------------
    print("=" * 60)
    print("1. df.head() — first rows (sanity check)")
    print("=" * 60)
    print(df.head())
    print()
    print("=" * 60)
    print("2. df.info() — column names, dtypes, non-null counts")
    print("=" * 60)
    df.info()
    print()

    # ------------------------------------------------------------------
    # Question B — Are there missing cells that would break comparisons?
    # I am asking: for each column, how many NaN values do we have?
    # The answer means: if counts are zero we can compare groups fairly; if
    # not, we must drop or fill those rows before claiming differences between
    # star types or colors.
    # ------------------------------------------------------------------
    print("=" * 60)
    print("3. df.isnull().sum() — missing values per column")
    print("=" * 60)
    print(df.isnull().sum())
    print()

    df["Star_type_label"] = df["Star type"].map(STAR_TYPE_LABELS)

    # ------------------------------------------------------------------
    # Question C — How common are star colors, types, and spectral classes?
    # I am asking: which categories dominate, and is the sample balanced?
    # The answer means: if one color or type dominates, averages later are
    # driven by that majority, and rare types need careful wording in claims.
    # ------------------------------------------------------------------
    print("=" * 60)
    print("4. value_counts() — Star type (label)")
    print("=" * 60)
    print(df["Star_type_label"].value_counts())
    print()
    print("=" * 60)
    print("5. value_counts() — Star color (top levels)")
    print("=" * 60)
    print(df["Star color"].value_counts())
    print()
    print("=" * 60)
    print("6. value_counts() — Spectral Class")
    print("=" * 60)
    print(df["Spectral Class"].value_counts())
    print()

    # ------------------------------------------------------------------
    # Question D — Among hot, luminous stars only, what does the table show?
    # I am asking: if we restrict to high temperature and high luminosity, who
    # is left? That subset approximates “upper left” of an HR-style diagram.
    # The answer means: we see whether giants and supergiants cluster there or
    # if dwarfs sneak in, which tests intuition about “hot = bright” shortcuts.
    # ------------------------------------------------------------------
    hot_bright = df[(df["Temperature (K)"] > 10000) & (df["Luminosity(L/Lo)"] > 100)]
    print("=" * 60)
    print("7. Filter — Temperature > 10,000 K AND Luminosity > 100 L/Lo")
    print(f"   Rows in subset: {len(hot_bright)} (out of {len(df)} total)")
    print("=" * 60)
    print(
        hot_bright[
            [
                "Star_type_label",
                "Temperature (K)",
                "Luminosity(L/Lo)",
                "Radius(R/Ro)",
                "Star color",
                "Spectral Class",
            ]
        ].head(15)
    )
    print()

    # ------------------------------------------------------------------
    # Question E — Which numeric properties separate star types on average?
    # I am asking: for each star type, what are the mean temperature, mean
    # luminosity, mean radius, and mean absolute magnitude?
    # The answer means: large gaps between types suggest that variable is
    # useful for classification; small gaps mean types overlap in that measure
    # and we need other columns or plots to tell them apart.
    # ------------------------------------------------------------------
    numeric_for_group = [
        "Temperature (K)",
        "Luminosity(L/Lo)",
        "Radius(R/Ro)",
        "Absolute magnitude(Mv)",
    ]
    grouped = df.groupby("Star_type_label", observed=True)[numeric_for_group].mean().round(2)
    print("=" * 60)
    print("8. groupby('Star_type_label')[numeric cols].mean() — averages by type")
    print("=" * 60)
    print(grouped)
    print()

    # ------------------------------------------------------------------
    # Short read on the three README / week5.md questions (plain interpretation)
    # ------------------------------------------------------------------
    print("=" * 60)
    print("9. Short tie-in to the three analytical questions (from week5.md)")
    print("=" * 60)
    spread_temp = grouped["Temperature (K)"].max() - grouped["Temperature (K)"].min()
    spread_lum = grouped["Luminosity(L/Lo)"].max() - grouped["Luminosity(L/Lo)"].min()
    print(
        f"(1) Separating types: mean temperature spans about {spread_temp:.0f} K across "
        f"types in this table; mean luminosity spans about {spread_lum:.1f} L/Lo — "
        "luminosity varies more in absolute terms, so it is a strong separator here."
    )
    corr_r_l = df["Radius(R/Ro)"].corr(df["Luminosity(L/Lo)"])
    print(
        f"(2) Bigger vs brighter: overall Pearson r between radius and luminosity "
        f"is {corr_r_l:.3f} (1.0 = perfect lockstep). That is an overall trend; "
        "the filter section shows hot bright subsets where types can still differ."
    )
    color_temp = df.groupby("Star color", observed=True)["Temperature (K)"].mean().sort_values()
    print(
        "(3) Color vs temperature: mean temperature by color (ranked coolest to hottest) "
        f"shows whether color order tracks temperature order in this dataset:\n{color_temp.round(0).to_string()}"
    )
    print()
    print("Done. Data file:", DATA_PATH)


if __name__ == "__main__":
    main()
