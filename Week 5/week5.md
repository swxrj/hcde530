# Week 5 — Star dataset

## 1. Dataset

I am using the Star Dataset from Kaggle: https://www.kaggle.com/datasets/deepu1109/star-dataset?resource=download

The dataset includes star properties such as temperature, luminosity, radius, absolute magnitude, color, spectral class, and star type. I download the CSV file, keep a copy as `Week 5/stars.csv`, load it with pandas in a Jupyter notebook (and in a small Python script for quick terminal runs), and use it to compare patterns across different categories of stars.

## 2. Three analytical questions

**Which star properties are most useful for telling star types apart?**  
I want to compare temperature, luminosity, radius, and absolute magnitude across star types to find which measurements show the biggest differences between categories.

**Are larger stars always brighter, or does the relationship change by star type?**  
I want to look at how radius, luminosity, and absolute magnitude relate to each other, and whether some types of stars break the simple assumption that bigger means brighter.

**Does a star’s color reliably indicate its temperature and type?**  
I want to compare star color with temperature, spectral class, and star type to see whether color can be used as a reliable clue, or whether there are overlaps and exceptions.

## 3. Why these questions matter

I am interested in space and astronomy, and these questions let me explore how stars can be understood through measurable traits like size, brightness, temperature, and color. I also want to practice turning complex scientific data into clear comparisons, interactive visuals, and possibly more artistic representations that make these patterns easier and more engaging for a broader audience to understand.

## 4. What I actually did

I worked in this order: load the CSV, use `head()` and `info()` to see shape and types, count missing values, use `value_counts()` on type, color, and spectral class, filter once to very hot and very bright rows, then `groupby` star type and take means for the main numeric columns. That order is on purpose. If the file is wrong or empty in spots, the later answers are not trustworthy.

What I saw in this file: mean luminosity jumps a lot between star types, so it is a strong lever for telling types apart in this table. Radius and luminosity correlate overall, but not tightly enough to treat “bigger = brighter” as a rule without checking type. Color words in the CSV are spelled inconsistently, so color is a rough guide to temperature, not a clean key, unless the labels are cleaned first.

The main notebook is `week5_stars_analysis.ipynb`. There is also `week5_stars_analysis.py` with the same steps for a quick printout from the terminal.

I used Cursor to speed up boilerplate and cell layout, but I chose the questions, the filter cutoffs, and I read the outputs to see if they matched what I expected before writing this file.
