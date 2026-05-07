# Week 5 — Star Dataset Analysis (A5 / Week 6 foundation)

This week I used pandas to start the analysis for my stars mini project. This is the base work for the Week 6 notebook, so I focused on building a clear analysis path first, not just writing code quickly.

## What I worked on

I used the star dataset from Kaggle and the local file `Week 5/stars.csv`.  
The dataset includes:

- Temperature (K)
- Luminosity (L/Lo)
- Radius (R/Ro)
- Absolute magnitude (Mv)
- Star type
- Star color
- Spectral class

I used this data to investigate three questions:

1. Which properties are most useful for distinguishing star types?
2. Are larger stars always brighter, or does that change by type?
3. Can star color reliably indicate temperature and star type?

## Why I chose this

I am interested in astronomy, and this dataset gives a way to connect measurable values (temperature, size, brightness, color) with star categories. I also want to practice translating technical data into explanations and visuals that are understandable for someone outside a technical class.

## How I approached the analysis with pandas

I used the same kinds of pandas operations from class and tied each one to a question:

- `head()` and `info()` to inspect structure, column types, and whether the file loaded correctly.
- `value_counts()` on columns like star type, color, and spectral class to see common categories and imbalance.
- Filtering rows (for example by ranges of temperature, luminosity, or radius) to inspect specific subsets.
- `groupby(...).mean()` to compare average values across star types.
- `isnull().sum()` to check for missing values before interpreting results.

For each operation in my analysis script/notebook, I explain in plain language what I am asking and what the result means for understanding stars, not only what the line of code does.

## Project approach (simple plan)

My approach is:

1. Check data quality and structure first.
2. Compare star types across the key numeric properties.
3. Test relationships between radius, luminosity, and magnitude.
4. Cross-check color against temperature, spectral class, and type.
5. Document patterns, overlaps, and exceptions carefully.

This order helps avoid weak conclusions. I first make sure the data is readable and consistent, then I compare groups, then I interpret where simple assumptions fail.

## What this Week 5 work sets up

This week gives me a solid analysis foundation for Week 6:

- reusable pandas workflow on `stars.csv`
- clearly stated analytical questions
- interpreted outputs that can become charts and notebook sections next week

The goal is not only to run pandas commands, but to make evidence-based observations from the dataset in clear language.

## Competency claim: C5 — Data Analysis with Pandas

I used pandas on `Week 5/stars.csv` (Kaggle star dataset) in `week5_stars_analysis.py` to answer the three questions in this file: whether numeric means separate star types, how radius and luminosity relate overall, and whether mean temperature lines up with color labels. The script loads the CSV, prints `head()` and `info()` to verify structure, counts missing values with `isnull().sum()`, uses `value_counts()` on type, color, and spectral class to check balance, filters to a hot-and-bright subset to stress-test intuition, and uses `groupby(...).mean()` on temperature, luminosity, radius, and absolute magnitude by star type so the gaps between types are visible in numbers, not only in plots. Each of those blocks has comments that state the question in plain English and what the output would imply for interpreting the stars table.
