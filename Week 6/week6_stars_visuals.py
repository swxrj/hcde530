from pathlib import Path
from textwrap import dedent

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


DATA_PATH = Path(__file__).resolve().parents[1] / "Week 5" / "stars.csv"
OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"
STATIC_DIR = Path(__file__).resolve().parent / "charts_static"
EXPORT_WIDTH = 2280
EXPORT_HEIGHT = 720  # 19:6 landscape ratio
UI_FONT = "Inter, Helvetica, Arial, sans-serif"
CODE_FONT = "JetBrains Mono, Fira Code, Menlo, Consolas, monospace"
HEADER_FONT = "Helvetica, Arial, sans-serif"
STAR_TYPE_COLOR_MAP = {
    "Brown Dwarf": "#ff9f43",
    "Red Dwarf": "#ff4d6d",
    "White Dwarf": "#6dd3ff",
    "Main Sequence": "#3a86ff",
    "Supergiant": "#2dd4bf",
    "Hypergiant": "#c77dff",
}

STAR_TYPE_LABELS = {
    0: "Brown Dwarf",
    1: "Red Dwarf",
    2: "White Dwarf",
    3: "Main Sequence",
    4: "Supergiant",
    5: "Hypergiant",
}

STAR_TYPE_ORDER = [
    "Brown Dwarf",
    "Red Dwarf",
    "White Dwarf",
    "Main Sequence",
    "Supergiant",
    "Hypergiant",
]
STAR_TYPE_SHORT_LABELS = {
    "Brown Dwarf": "Brown D.",
    "Red Dwarf": "Red D.",
    "White Dwarf": "White D.",
    "Main Sequence": "Main Seq.",
    "Supergiant": "Superg.",
    "Hypergiant": "Hyperg.",
}

COLOR_NORMALIZATION = {
    "blue white": "Blue-White",
    "blue-white": "Blue-White",
    "bluewhite": "Blue-White",
    "blue": "Blue",
    "red": "Red",
    "white": "White",
    "white-yellow": "White-Yellow",
    "yellow-white": "Yellow-White",
    "yellowish white": "Yellow-White",
    "yellowish": "Yellowish",
    "yellowish-orange": "Yellowish-Orange",
    "orange": "Orange",
    "orange-red": "Orange-Red",
    "pale yellow orange": "Pale Yellow-Orange",
    "whitish": "Whitish",
}


def clean_star_color(value: str) -> str:
    key = str(value).strip().lower().replace("  ", " ")
    key = key.replace("_", " ")
    mapped = COLOR_NORMALIZATION.get(key)
    if mapped:
        return mapped
    # Fallback keeps uncommon categories visible instead of dropping them.
    return str(value).strip().title()


def write_card_html(
    fig: go.Figure, output_path: Path, card_title: str, how_to_read: str, answer: str
) -> None:
    plot_html = fig.to_html(full_html=False, include_plotlyjs="cdn")
    html = dedent(
        f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{card_title}</title>
          <style>
            :root {{
              --bg: #f4f6fb;
              --card: #ffffff;
              --ink: #0f172a;
              --muted: #475569;
              --accent: #3b82f6;
              --border: #e2e8f0;
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              padding: 40px;
              background: radial-gradient(circle at 10% 10%, #edf4ff 0%, #f5f8ff 35%, var(--bg) 70%);
              font-family: {HEADER_FONT};
              color: var(--ink);
            }}
            .card {{
              max-width: 1700px;
              width: 98vw;
              margin: 0 auto;
              background: var(--card);
              border: 1px solid var(--border);
              border-radius: 32px;
              box-shadow: 0 30px 70px rgba(15, 23, 42, 0.14);
              padding: 42px 42px 34px;
            }}
            .top {{
              display: grid;
              gap: 12px;
              margin-bottom: 16px;
            }}
            .pill {{
              display: inline-block;
              width: fit-content;
              padding: 6px 12px;
              border-radius: 999px;
              background: #eef2ff;
              color: #1e40af;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.02em;
            }}
            .q {{
              margin: 0;
              font-size: 34px;
              line-height: 1.2;
              font-weight: 800;
            }}
            .meta {{
              margin: 0;
              font-size: 15px;
              line-height: 1.55;
              color: var(--muted);
            }}
            .meta b {{ color: var(--ink); }}
            .plot-wrap {{
              margin-top: 18px;
              border-radius: 22px;
              overflow: hidden;
              border: 1px solid var(--border);
              background: #fff;
              padding: 22px;
            }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="top">
              <span class="pill">STAR ANALYSIS</span>
              <h1 class="q">{card_title}</h1>
              <p class="meta"><b>How to read:</b> {how_to_read}</p>
              <p class="meta"><b>What this shows:</b> {answer}</p>
            </div>
            <div class="plot-wrap">
              {plot_html}
            </div>
          </div>
        </body>
        </html>
        """
    )
    output_path.write_text(html)


def write_assignment_images(figures: dict[str, go.Figure]) -> None:
    """Write assignment-ready static chart files (PNG only)."""
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    for stem, fig in figures.items():
        width = EXPORT_WIDTH
        height = EXPORT_HEIGHT
        # Q1 is a 2x2 faceted chart; it needs extra vertical room.
        if stem == "q1_type_separation":
            height = 1080
        fig.write_image(
            STATIC_DIR / f"{stem}.png",
            width=width,
            height=height,
            scale=2,
        )


def write_chart_justifications() -> None:
    notes_path = Path(__file__).resolve().parent / "chart_justifications.md"
    notes = dedent(
        """
        # A6 Chart Justifications (MP1 Analysis Section)

        These three charts are saved as static files in `Week 6/charts_static/`.

        1. `q1_type_separation.png`
           - Question addressed: Which properties best separate star types?
           - Why this chart: A standardized heatmap shows contrast across star types and properties in one view.
           - Reading: Strong color contrast and larger absolute z-scores indicate better separation by that property.

        2. `q2_radius_luminosity.png`
           - Question addressed: Are larger stars always brighter?
           - Why this chart: Log-log scatter is the appropriate form for wide-range positive variables.
           - Reading: General upward trend indicates larger stars are often brighter, while spread indicates exceptions.

        3. `q3_color_temperature.png`
           - Question addressed: Does color reliably indicate temperature and type?
           - Why this chart: Box plot compares temperature distributions across cleaned color categories.
           - Reading: Higher/lower medians and overlap levels show whether color is a strong or weak predictor.
        """
    ).strip() + "\n"
    notes_path.write_text(notes)


def apply_visual_theme(fig: go.Figure) -> go.Figure:
    # Clean, presentation-ready style with no decorative effects.
    fig.update_layout(
        template="simple_white",
        paper_bgcolor="#ffffff",
        plot_bgcolor="#ffffff",
        font={"family": UI_FONT, "size": 12, "color": "#0f172a"},
        title_font={"family": UI_FONT, "size": 19, "color": "#0f172a"},
        margin={"l": 110, "r": 60, "t": 100, "b": 130},
        height=980,
        title={"y": 0.98, "x": 0.01, "xanchor": "left", "yanchor": "top", "automargin": True},
        hoverlabel={
            "font": {"family": CODE_FONT, "size": 12},
            "bgcolor": "#ffffff",
            "bordercolor": "#94a3b8",
        },
        legend={
            "font": {"family": CODE_FONT, "size": 11},
            "orientation": "h",
            "yanchor": "bottom",
            "y": 1.16,
            "xanchor": "right",
            "x": 1,
            "bgcolor": "rgba(255,255,255,0.9)",
            "bordercolor": "#e2e8f0",
            "borderwidth": 1,
        },
        colorway=["#3a86ff", "#ff4d6d", "#2dd4bf", "#c77dff", "#ff9f43", "#6dd3ff"],
    )
    fig.update_xaxes(
        showgrid=True,
        gridcolor="#e2e8f0",
        zeroline=False,
        linecolor="#94a3b8",
        automargin=True,
        tickangle=-35,
        tickfont={"family": CODE_FONT, "size": 10, "color": "#334155"},
        title_font={"family": CODE_FONT, "size": 12, "color": "#1e293b"},
    )
    fig.update_yaxes(
        showgrid=True,
        gridcolor="#e2e8f0",
        zeroline=False,
        linecolor="#94a3b8",
        automargin=True,
        tickfont={"family": CODE_FONT, "size": 10, "color": "#334155"},
        title_font={"family": CODE_FONT, "size": 12, "color": "#1e293b"},
    )
    fig.update_traces(marker_line_width=0.8, selector={"type": "scatter"})
    fig.update_traces(marker_line_width=0.7, selector={"type": "bar"})
    return fig


def question1_profile_heatmap(df: pd.DataFrame) -> go.Figure:
    """Richer Q1 chart: standardized star-type profiles by metric."""
    temp = df.copy()
    temp["Luminosity (L/Lo, log10)"] = temp["Luminosity(L/Lo)"].where(
        temp["Luminosity(L/Lo)"] > 0
    ).apply(lambda v: np.log10(v) if pd.notna(v) else np.nan)
    temp["Radius (R/Ro, log10)"] = temp["Radius(R/Ro)"].where(
        temp["Radius(R/Ro)"] > 0
    ).apply(lambda v: np.log10(v) if pd.notna(v) else np.nan)

    metric_cols = [
        "Temperature (K)",
        "Luminosity (L/Lo, log10)",
        "Radius (R/Ro, log10)",
        "Absolute magnitude(Mv)",
    ]
    means = (
        temp.groupby("Star_type_label", observed=True)[metric_cols]
        .mean()
        .reindex(STAR_TYPE_ORDER)
    )
    zscores = (means - means.mean()) / means.std(ddof=0)
    zscores = zscores.fillna(0)
    zscores = zscores.rename(columns={"Absolute magnitude(Mv)": "Absolute Magnitude (Mv)"})

    fig = go.Figure(
        data=[
            go.Heatmap(
                z=zscores.values,
                x=zscores.columns.tolist(),
                y=zscores.index.tolist(),
                zmid=0,
                colorscale="RdBu",
                reversescale=True,
                text=np.round(zscores.values, 2),
                texttemplate="%{text}",
                colorbar={"title": "Z-score"},
            )
        ]
    )
    fig.update_layout(
        title="Q1: Star-Type Separation Profile Across Key Properties",
        xaxis_title="Star Property",
        yaxis_title="Star Type",
    )
    fig.update_xaxes(tickangle=-10)
    apply_visual_theme(fig)
    return fig


def load_and_prepare() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df["Star_type_label"] = df["Star type"].map(STAR_TYPE_LABELS)
    df["Star_color_clean"] = df["Star color"].apply(clean_star_color)
    df["log10_Luminosity"] = df["Luminosity(L/Lo)"].where(
        df["Luminosity(L/Lo)"] > 0
    ).apply(lambda v: pd.NA if pd.isna(v) else np.log10(v))
    df["log10_Radius"] = df["Radius(R/Ro)"].where(df["Radius(R/Ro)"] > 0).apply(
        lambda v: pd.NA if pd.isna(v) else np.log10(v)
    )
    return df


def question1_type_separation(df: pd.DataFrame) -> tuple[go.Figure, go.Figure]:
    metrics = [
        "Temperature (K)",
        "Luminosity(L/Lo)",
        "Radius(R/Ro)",
        "Absolute magnitude(Mv)",
    ]

    long_df = df.melt(
        id_vars=["Star_type_label"],
        value_vars=metrics,
        var_name="Metric",
        value_name="Value",
    )
    log_metrics = {"Luminosity(L/Lo)", "Radius(R/Ro)"}
    long_df["Metric_for_plot"] = long_df["Metric"].where(
        ~long_df["Metric"].isin(log_metrics),
        "log10(" + long_df["Metric"] + ")",
    )
    long_df["Value_for_plot"] = long_df["Value"]
    for metric in log_metrics:
        mask = long_df["Metric"] == metric
        long_df.loc[mask, "Value_for_plot"] = long_df.loc[mask, "Value"].apply(
            lambda v: np.log10(v) if v > 0 else pd.NA
        )

    box_fig = px.box(
        long_df.dropna(subset=["Value_for_plot"]),
        x="Star_type_label",
        y="Value_for_plot",
        color="Star_type_label",
        color_discrete_map=STAR_TYPE_COLOR_MAP,
        facet_col="Metric_for_plot",
        facet_col_wrap=2,
        category_orders={"Star_type_label": STAR_TYPE_ORDER},
        title="Star Type Separation Across Temperature, Luminosity, Radius, and Absolute Magnitude",
        labels={
            "Star_type_label": "Star Type",
            "Value_for_plot": "Metric Value",
        },
    )
    box_fig.update_layout(showlegend=False)
    box_fig.update_layout(height=1320, margin={"t": 90, "b": 180, "l": 110, "r": 50})
    box_fig.update_yaxes(matches=None)
    # Faceted charts get cluttered quickly; avoid repeated axis titles per panel.
    box_fig.update_xaxes(title_text=None)
    box_fig.update_yaxes(title_text=None)
    box_fig.update_xaxes(
        tickmode="array",
        tickvals=STAR_TYPE_ORDER,
        ticktext=[STAR_TYPE_SHORT_LABELS[s] for s in STAR_TYPE_ORDER],
        tickangle=-30,
        tickfont={"size": 9},
    )
    # Faceted chart rubric labels: provide clear global x/y axis descriptors.
    box_fig.add_annotation(
        x=0.5,
        y=0.03,
        xref="paper",
        yref="paper",
        showarrow=False,
        text="X-axis: Star Type (categorical classes)",
        font={"family": HEADER_FONT, "size": 12, "color": "#334155"},
    )
    box_fig.add_annotation(
        x=0.01,
        y=1.02,
        xref="paper",
        yref="paper",
        showarrow=False,
        text=(
            "Y-axis: Metric Value (Temperature in K; Luminosity L/Lo and Radius R/Ro shown as log10; "
            "Absolute Magnitude Mv)"
        ),
        font={"family": HEADER_FONT, "size": 11, "color": "#334155"},
        align="left",
    )
    box_fig.for_each_annotation(
        lambda a: a.update(
            text=a.text.replace("Metric_for_plot=", "Metric: "),
            font={"size": 12},
        )
    )
    box_fig.update_layout(
        title={"text": "Q1 distribution by metric", "x": 0.01}
    )
    apply_visual_theme(box_fig)

    grouped = (
        df.groupby("Star_type_label", observed=True)[metrics]
        .mean()
        .reindex(STAR_TYPE_ORDER)
        .reset_index()
    )
    grouped_long = grouped.melt(
        id_vars=["Star_type_label"], var_name="Metric", value_name="Mean"
    )
    log_metrics = {"Luminosity(L/Lo)", "Radius(R/Ro)"}
    grouped_long["Metric_for_plot"] = grouped_long["Metric"].where(
        ~grouped_long["Metric"].isin(log_metrics),
        "log10(" + grouped_long["Metric"] + ")",
    )
    grouped_long["Mean_for_plot"] = grouped_long["Mean"]
    for metric in log_metrics:
        mask = grouped_long["Metric"] == metric
        grouped_long.loc[mask, "Mean_for_plot"] = grouped_long.loc[mask, "Mean"].apply(
            lambda v: np.log10(v) if v > 0 else pd.NA
        )

    mean_fig = px.bar(
        grouped_long.dropna(subset=["Mean_for_plot"]),
        x="Star_type_label",
        y="Mean_for_plot",
        color="Star_type_label",
        color_discrete_map=STAR_TYPE_COLOR_MAP,
        facet_col="Metric_for_plot",
        facet_col_wrap=2,
        category_orders={"Star_type_label": STAR_TYPE_ORDER},
        title="Q1: Mean values by type (cleaner comparison per metric)",
        labels={"Star_type_label": "Star Type", "Mean_for_plot": "Mean value"},
    )
    mean_fig.update_layout(showlegend=False)
    mean_fig.update_layout(height=1320, margin={"t": 90, "b": 180, "l": 110, "r": 50})
    mean_fig.update_yaxes(matches=None)
    mean_fig.update_xaxes(title_text=None)
    mean_fig.update_yaxes(title_text=None)
    mean_fig.update_xaxes(
        tickmode="array",
        tickvals=STAR_TYPE_ORDER,
        ticktext=[STAR_TYPE_SHORT_LABELS[s] for s in STAR_TYPE_ORDER],
        tickangle=-30,
        tickfont={"size": 9},
    )
    mean_fig.for_each_annotation(
        lambda a: a.update(
            text=a.text.replace("Metric_for_plot=", "Metric: "),
            font={"size": 12},
        )
    )
    mean_fig.update_layout(
        title={"text": "Q1 average comparison by metric", "x": 0.01}
    )
    apply_visual_theme(mean_fig)
    return box_fig, mean_fig


def question2_radius_vs_luminosity(df: pd.DataFrame) -> tuple[go.Figure, go.Figure]:
    corr_radius_lum = df["Radius(R/Ro)"].corr(df["Luminosity(L/Lo)"])
    scatter_fig = px.scatter(
        df,
        x="Radius(R/Ro)",
        y="Luminosity(L/Lo)",
        color="Star_type_label",
        color_discrete_map=STAR_TYPE_COLOR_MAP,
        size="Temperature (K)",
        hover_data=[
            "Temperature (K)",
            "Absolute magnitude(Mv)",
            "Star_color_clean",
            "Spectral Class",
        ],
        log_x=True,
        log_y=True,
        category_orders={"Star_type_label": STAR_TYPE_ORDER},
        title="Radius vs Luminosity by Star Type (Log-Log Scale)",
        labels={
            "Radius(R/Ro)": "Radius (R/Ro, solar radii, log scale)",
            "Luminosity(L/Lo)": "Luminosity (L/Lo, solar luminosities, log scale)",
            "Star_type_label": "Star Type",
        },
    )
    scatter_fig.update_layout(
        title={"text": "Q2 overall radius vs luminosity", "x": 0.01}
    )
    scatter_fig.update_xaxes(
        title_text="Radius (R/Ro, log scale) — right means larger stars"
    )
    scatter_fig.update_yaxes(
        title_text="Luminosity (L/Lo, log scale) — up means brighter stars"
    )
    apply_visual_theme(scatter_fig)
    facet_fig = px.scatter(
        df,
        x="Radius(R/Ro)",
        y="Luminosity(L/Lo)",
        color="Star_type_label",
        color_discrete_map=STAR_TYPE_COLOR_MAP,
        facet_col="Star_type_label",
        facet_col_wrap=3,
        log_x=True,
        log_y=True,
        hover_data=["Temperature (K)", "Absolute magnitude(Mv)", "Star_color_clean"],
        category_orders={"Star_type_label": STAR_TYPE_ORDER},
        title="Q2: Radius-luminosity relationship by star type (faceted)",
    )
    facet_fig.update_layout(showlegend=False)
    facet_fig.update_layout(height=1200)
    facet_fig.update_xaxes(title_text="Radius (log scale; right = larger)")
    facet_fig.update_yaxes(title_text="Luminosity (log scale; up = brighter)")
    facet_fig.update_layout(
        title={"text": "Q2 relationship by star type", "x": 0.01}
    )
    apply_visual_theme(facet_fig)
    return scatter_fig, facet_fig


def question3_color_temperature_type(df: pd.DataFrame) -> tuple[go.Figure, go.Figure]:
    color_order = (
        df.groupby("Star_color_clean", observed=True)["Temperature (K)"]
        .mean()
        .sort_values()
        .index.tolist()
    )

    box_color_fig = px.box(
        df,
        x="Star_color_clean",
        y="Temperature (K)",
        color="Star_type_label",
        color_discrete_map=STAR_TYPE_COLOR_MAP,
        category_orders={
            "Star_color_clean": color_order,
            "Star_type_label": STAR_TYPE_ORDER,
        },
        title="Temperature Distribution by Star Color and Star Type",
        labels={
            "Star_color_clean": "Star Color (cleaned categories)",
            "Temperature (K)": "Temperature (K)",
            "Star_type_label": "Star Type",
        },
    )
    box_color_fig.update_layout(
        title={"text": "Q3 color vs temperature", "x": 0.01}
    )
    box_color_fig.update_xaxes(
        title_text="Cleaned color label (left-to-right roughly cooler to hotter)"
    )
    box_color_fig.update_yaxes(
        title_text="Temperature (K) — up means hotter stars"
    )
    apply_visual_theme(box_color_fig)
    pivot = (
        df.pivot_table(
            index="Star_type_label",
            columns="Spectral Class",
            values="Temperature (K)",
            aggfunc="count",
            fill_value=0,
        )
        .reindex(STAR_TYPE_ORDER)
        .fillna(0)
    )
    heatmap_fig = go.Figure(
        data=[
            go.Heatmap(
                z=pivot.values,
                x=pivot.columns.tolist(),
                y=pivot.index.tolist(),
                text=pivot.values,
                texttemplate="%{text}",
                colorscale="Blues",
                colorbar={"title": "Count", "tickfont": {"family": CODE_FONT}},
            )
        ]
    )
    heatmap_fig.update_layout(
        title="Q3: Star type by spectral class (count heatmap)",
        xaxis_title="Spectral Class (O/B/A/F/G/K/M)",
        yaxis_title="Star Type",
    )
    heatmap_fig.update_layout(
        title={"text": "Q3 type and spectral association", "x": 0.01}
    )
    apply_visual_theme(heatmap_fig)

    return box_color_fig, heatmap_fig


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_and_prepare()

    q1_box, q1_mean = question1_type_separation(df)
    q1_profile = question1_profile_heatmap(df)
    q2_scatter, q2_facet = question2_radius_vs_luminosity(df)
    q3_box, q3_heatmap = question3_color_temperature_type(df)

    figures = {
        "q1_type_separation_box_fixed.html": (
            q1_box,
            "Q1: Which measurements separate star types best?",
            "Each panel is one metric. Less overlap between categories means stronger separation.",
            "Luminosity and radius separate categories most strongly; temperature and magnitude show more overlap.",
        ),
        "q1_type_means_bar_fixed.html": (
            q1_mean,
            "Q1 (average view): Which measurements separate star types best?",
            "Compare bar-height gaps inside each panel.",
            "Mean luminosity and mean radius vary the most across types.",
        ),
        "q2_radius_luminosity_scatter.html": (
            q2_scatter,
            "Q2: Are bigger stars always brighter?",
            "Each point is one star. Right is larger radius, up is brighter luminosity (both logarithmic).",
            "Overall trend is positive, but spread shows larger does not always mean brighter.",
        ),
        "q2_radius_luminosity_facets.html": (
            q2_facet,
            "Q2 (by type): Does the pattern stay the same for every type?",
            "Compare slope and spread panel by panel with shared axis meaning.",
            "Relationship shape differs by type, so one single rule is too simple.",
        ),
        "q3_color_temperature_box.html": (
            q3_box,
            "Q3: Does color reliably indicate temperature and type?",
            "Color groups on x-axis, temperature on y-axis. Cleaner separation means higher reliability.",
            "Red is generally cooler and blue/blue-white hotter, but overlap remains substantial.",
        ),
        "q3_type_spectral_heatmap.html": (
            q3_heatmap,
            "Q3 support: Which type-spectral combinations are common?",
            "Each cell is a count; darker cells mean stronger pairing.",
            "Several concentrated cells show clear type-spectral associations.",
        ),
    }

    for filename, payload in figures.items():
        fig, title, how_to_read, answer = payload
        write_card_html(  # Card shell provides the polished look.
            fig, OUTPUT_DIR / filename, title, how_to_read, answer
        )

    # A6 requirement: commit static chart image files (.png or .svg).
    assignment_figures = {
        "q1_type_separation": q1_profile,
        "q2_radius_luminosity": q2_scatter,
        "q3_color_temperature": q3_box,
    }
    write_assignment_images(assignment_figures)
    write_chart_justifications()

    print("Saved Plotly visuals to:", OUTPUT_DIR)
    print("Files:")
    for name in figures:
        print(" -", name)
    print("Saved static assignment charts to:", STATIC_DIR)


if __name__ == "__main__":
    main()
