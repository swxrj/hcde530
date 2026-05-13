# Week 6 - A6 first MP1 visualization

## What this week adds to MP1

This week I moved the star dataset work from pandas summaries into static charts for the Analysis section of MP1b. The dataset is still the Kaggle star dataset from `Week 5/stars.csv`, and the three questions are the same ones I declared in Week 5:

1. Which star properties are most useful for telling star types apart?
2. Are larger stars always brighter, or does the relationship change by star type?
3. Does a star's color reliably indicate its temperature and type?

The final assignment charts are saved as PNG files in `Week 6/charts_static/`:

- `q1_type_separation.png`
- `q2_radius_luminosity.png`
- `q3_color_temperature.png`

I also kept the code that generates them in `Week 6/week6_stars_visuals.py`, plus a notebook version in `Week 6/week6_stars_visuals.ipynb`. The HTML files in `Week 6/outputs/` were useful while I was iterating on design, but the PNG files are the ones that directly satisfy the A6 requirement.

## Process and approach

I started from the Week 5 pandas analysis rather than starting over. In Week 5 I had already loaded the CSV, checked missing values, counted star types, looked at color and spectral class categories, and used `groupby()` to compare numeric properties by star type. That helped me avoid making charts just because they looked nice. Each chart needed to answer one of the existing MP1 questions.

The first version used several Plotly charts and HTML card layouts. That looked more polished interactively, but the A6 requirement specifically asks for committed static image files, so I added image export with Kaleido. I also had to install the Chrome runtime that Kaleido uses for exports. After that, I changed the export logic so it writes PNG files into `Week 6/charts_static/`.

The hardest part was the first question. My original faceted box plot tried to show four metrics at once, but the exported image had overlapping axis labels. I tried spacing, larger image size, shorter labels, and moving global axis labels, but it was still cluttered. I eventually changed the Q1 static chart to a heatmap. That was a better choice for the static assignment because it answers the same question with less label chaos.

I used Plotly because it let me iterate quickly and export static images from the same figure objects. I cleaned the data before plotting by adding readable star type labels, cleaning repeated color spellings, and using log10 versions of luminosity and radius where needed. Luminosity and radius cover huge ranges in this dataset, so plotting or comparing them on a raw linear scale hides important differences.

## Chart 1: Which star properties are most useful for telling star types apart?

File: `Week 6/charts_static/q1_type_separation.png`

The chart is a heatmap of star type by property. The properties are temperature, log10 luminosity, log10 radius, and absolute magnitude. I standardized the mean values for each property into z-scores so they can be compared on the same color scale. That matters because temperature, luminosity, radius, and magnitude do not use the same units.

This chart answers the first question by showing which properties create the clearest contrast across star types. If one property has strong color changes from one star type to another, that property is doing more work in separating the categories.

The main pattern I see is that luminosity and radius separate the types especially well. Supergiants and hypergiants are high on log luminosity, while brown dwarfs, red dwarfs, and white dwarfs are low. Radius also separates the giant classes from the dwarf classes, with hypergiants standing out the most. Temperature helps, but it is not as clean by itself. White dwarfs are hot but small and dim, so temperature alone would not tell the whole story.

Absolute magnitude also helps, but it has the astronomy-specific twist that lower or more negative values mean brighter stars. That is why the giant classes have low absolute magnitude values while dwarfs have higher values. Overall, I would infer that star type is best explained by using multiple properties together, especially luminosity and radius, instead of relying on one column.

## Chart 2: Are larger stars always brighter, or does the relationship change by star type?

File: `Week 6/charts_static/q2_radius_luminosity.png`

This chart is a scatter plot with radius on the x-axis and luminosity on the y-axis. Both axes use log scale because radius and luminosity vary by many orders of magnitude. Each point is one star, and the color shows star type.

This is the right chart type for the question because the question is about the relationship between two numeric variables. A scatter plot lets me see whether the points move upward as they move to the right. If they do, larger stars tend to be brighter.

The plot does show a strong upward pattern overall. When I calculated the correlation on the log-transformed radius and luminosity values, it was about `0.918`, which is very strong. On the raw values the correlation was lower, around `0.527`, because the extreme giant stars dominate the scale. That difference is exactly why the log-log view is useful.

The answer is not simply "bigger always means brighter." The relationship is strong overall, but the points cluster by star type. White dwarfs are a good example of why the simple rule breaks down: they can be hot, but they are small and not very luminous compared with giant stars. The chart supports a more careful answer: larger stars are often brighter in this dataset, but star type changes the relationship.

## Chart 3: Does a star's color reliably indicate its temperature and type?

File: `Week 6/charts_static/q3_color_temperature.png`

This chart is a box plot of temperature by cleaned star color, with star type shown by color. I cleaned the `Star color` labels because the CSV had repeated versions of the same idea, such as `Blue-white`, `Blue White`, and `Blue white`. Without that cleanup, the x-axis would split one category into several fake categories.

This chart answers the third question by showing whether color groups have distinct temperature ranges. If color were a reliable predictor, the boxes would be separated with little overlap.

The pattern mostly follows the basic astronomy expectation: red stars are cooler on average, while blue and blue-white stars are hotter on average. In the cleaned data, red stars have a mean temperature around `3292 K`, while blue stars average around `21918 K`, and blue-white stars average around `16660 K`.

But the chart also shows overlap and exceptions. Some color categories have wide ranges, and some categories only have a few rows. That makes color a useful clue, not a perfect classifier. I would infer that color can help estimate temperature directionally, especially red vs blue, but I would not use color alone to determine star type. It works better when combined with temperature, luminosity, radius, and spectral class.

## What this shows about the work

This assignment ended up being more than "make three charts." I had to make the charts answer the questions, fit the data, and survive being exported as static files. The final evidence is in `Week 6/charts_static/`, but the thinking is in the path I took to get there.

I used Cursor to move faster through the plotting code, but I did not treat the first output as finished. The early Q1 faceted box plot technically used the right data, but the static PNG had overlapping labels and was hard to read. I tried practical fixes first: wider exports, shorter labels, more spacing, and moved axis text. When those still did not make the chart clear enough, I changed the chart type. The heatmap now answers the same question with fewer moving parts. That was a better decision than forcing a cluttered chart to work.

The script also shows a few concrete data-handling decisions. It reads the actual CSV from `Week 5/stars.csv`, maps the numeric star type codes into readable labels, and cleans repeated color spellings before making the color chart. That cleanup matters because `Blue-white`, `Blue White`, and `Blue white` should not become three different categories in the final visualization. I also used log10 versions of luminosity and radius because those values span huge ranges; without that, the largest stars dominate the scale and smaller patterns are harder to see.

The pandas work is still underneath the charts. For Q1, I grouped by star type and calculated the mean values for the main properties before standardizing them for the heatmap. For Q2, I compared radius and luminosity directly and checked the relationship on both raw and log-transformed values. For Q3, I grouped the cleaned color categories and looked at their temperature ranges. The charts are not separate from the analysis; they are visual versions of those pandas operations.

I also tried to keep the code organized enough that future me could explain it. `Week 6/week6_stars_visuals.py` has separate parts for loading and preparing the data, building the charts, writing the HTML previews, and exporting the final PNG files. That structure helped when I had to change only the Q1 chart without breaking Q2 and Q3.

The main judgment call was knowing when a chart was not good enough. A visualization can be technically correct and still fail the assignment if the labels are unreadable or the viewer cannot tell what question it answers. I changed the Q1 chart because of that. I also removed SVG exports after deciding PNG files were enough for the assignment, which kept the submitted files simpler.

## What I would do next

For MP1b, I would keep these three charts as the start of the Analysis section, then add a short written interpretation under each one in the notebook. I would also consider adding one interactive version of the Q2 scatter plot for exploration, but I would keep the static PNGs as the committed A6 evidence because that is what the assignment asks for.
