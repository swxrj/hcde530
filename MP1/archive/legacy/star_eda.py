# ============================================================
#  Star Type Dataset — Starter EDA Script
#  Dataset: kaggle.com/datasets/deepu1109/star-dataset
#  Download the CSV and rename it to Stars.csv in the same folder
# ============================================================

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import seaborn as sns
from matplotlib.patches import Patch

# ── 0. Style ─────────────────────────────────────────────────
plt.rcParams.update({
    'figure.dpi': 120,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'font.family': 'sans-serif',
    'axes.titlesize': 13,
    'axes.titleweight': 'bold',
})

# ── 1. Load & Inspect ────────────────────────────────────────
df = pd.read_csv('Stars.csv')

print("=" * 50)
print("DATASET OVERVIEW")
print("=" * 50)
print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n")
print("Column names:", df.columns.tolist())
print("\nFirst 5 rows:")
print(df.head())
print("\nData types:")
print(df.dtypes)
print("\nMissing values:")
print(df.isnull().sum())
print("\nBasic statistics:")
print(df.describe())

# ── 2. Clean up star type labels ─────────────────────────────
# The dataset uses numeric codes 0-5 for star types
type_map = {
    0: 'Brown Dwarf',
    1: 'Red Dwarf',
    2: 'White Dwarf',
    3: 'Main Sequence',
    4: 'Supergiant',
    5: 'Hypergiant'
}
df['Star_type_label'] = df['Star type'].map(type_map)

# Colour palette — one colour per star type, loosely matching real star colours
type_colors = {
    'Brown Dwarf':   '#8B4513',
    'Red Dwarf':     '#FF4500',
    'White Dwarf':   '#B0C4DE',
    'Main Sequence': '#FFD700',
    'Supergiant':    '#FFA07A',
    'Hypergiant':    '#FF6347',
}

# ── 3. Star Type Distribution ────────────────────────────────
fig, ax = plt.subplots(figsize=(8, 4))
counts = df['Star_type_label'].value_counts().reindex(type_map.values())
colors = [type_colors[t] for t in counts.index]
bars = ax.bar(counts.index, counts.values, color=colors, edgecolor='white', linewidth=0.8)
ax.bar_label(bars, padding=4, fontsize=11)
ax.set_title('Distribution of Star Types')
ax.set_ylabel('Count')
ax.set_xlabel('')
ax.set_ylim(0, counts.max() + 10)
plt.xticks(rotation=20, ha='right')
plt.tight_layout()
plt.savefig('plot1_star_type_distribution.png')
plt.show()
print("Saved: plot1_star_type_distribution.png")

# ── 4. H-R Diagram (the main event) ─────────────────────────
# Classic plot: Temperature (x, reversed) vs Luminosity (y, log scale)
fig, ax = plt.subplots(figsize=(9, 7))

for star_type, group in df.groupby('Star_type_label'):
    ax.scatter(
        group['Temperature (K)'],
        group['Luminosity(L/Lo)'],
        label=star_type,
        color=type_colors[star_type],
        s=60, alpha=0.85, edgecolors='white', linewidths=0.4
    )

ax.set_xscale('log')
ax.set_yscale('log')
ax.invert_xaxis()   # Hot stars (blue) on left, cool stars (red) on right
ax.set_xlabel('Temperature (K)  →  cooler', fontsize=11)
ax.set_ylabel('Luminosity (L/Lo)  →  brighter', fontsize=11)
ax.set_title('Hertzsprung–Russell (H-R) Diagram', fontsize=14)
ax.legend(title='Star Type', bbox_to_anchor=(1.01, 1), loc='upper left', fontsize=10)

# Label the main regions
ax.text(5500, 1e6, 'Supergiants /\nHypergiants', fontsize=8.5,
        color='gray', ha='center', style='italic')
ax.text(5500, 1.0, 'Main Sequence', fontsize=8.5,
        color='gray', ha='center', style='italic')
ax.text(30000, 0.001, 'White Dwarfs', fontsize=8.5,
        color='gray', ha='center', style='italic')
ax.text(3000, 0.0001, 'Dwarfs', fontsize=8.5,
        color='gray', ha='center', style='italic')

plt.tight_layout()
plt.savefig('plot2_hr_diagram.png', bbox_inches='tight')
plt.show()
print("Saved: plot2_hr_diagram.png")

# ── 5. Temperature Distribution by Star Type ─────────────────
fig, ax = plt.subplots(figsize=(9, 5))
order = list(type_map.values())
sns.boxplot(
    data=df, x='Star_type_label', y='Temperature (K)',
    order=order,
    palette=type_colors,
    width=0.5, linewidth=1.2,
    ax=ax
)
ax.set_title('Temperature Distribution by Star Type')
ax.set_xlabel('')
ax.set_ylabel('Temperature (K)')
plt.xticks(rotation=20, ha='right')
plt.tight_layout()
plt.savefig('plot3_temperature_boxplot.png')
plt.show()
print("Saved: plot3_temperature_boxplot.png")

# ── 6. Luminosity Distribution by Star Type ──────────────────
fig, ax = plt.subplots(figsize=(9, 5))
sns.boxplot(
    data=df, x='Star_type_label', y='Luminosity(L/Lo)',
    order=order,
    palette=type_colors,
    width=0.5, linewidth=1.2,
    ax=ax
)
ax.set_yscale('log')
ax.set_title('Luminosity Distribution by Star Type (log scale)')
ax.set_xlabel('')
ax.set_ylabel('Luminosity (L/Lo)')
plt.xticks(rotation=20, ha='right')
plt.tight_layout()
plt.savefig('plot4_luminosity_boxplot.png')
plt.show()
print("Saved: plot4_luminosity_boxplot.png")

# ── 7. Correlation Heatmap ───────────────────────────────────
numeric_cols = ['Temperature (K)', 'Luminosity(L/Lo)', 'Radius(R/Ro)',
                'Absolute magnitude(Mv)', 'Star type']
corr = df[numeric_cols].corr()

fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(
    corr, annot=True, fmt='.2f', cmap='coolwarm',
    center=0, linewidths=0.5, ax=ax,
    annot_kws={'size': 11}
)
ax.set_title('Correlation Matrix — Numeric Features')
plt.tight_layout()
plt.savefig('plot5_correlation_heatmap.png')
plt.show()
print("Saved: plot5_correlation_heatmap.png")

# ── 8. Spectral Class Distribution ───────────────────────────
fig, ax = plt.subplots(figsize=(7, 4))
spectral_order = ['O', 'B', 'A', 'F', 'G', 'K', 'M']   # hot → cool
spectral_counts = df['Spectral Class'].value_counts().reindex(spectral_order).fillna(0)
spectral_palette = ['#4169E1', '#87CEEB', '#FFFFFF', '#FFFACD',
                    '#FFD700', '#FFA500', '#FF4500']
bars = ax.bar(spectral_counts.index, spectral_counts.values,
              color=spectral_palette, edgecolor='gray', linewidth=0.6)
ax.bar_label(bars, padding=3, fontsize=11)
ax.set_title('Stars by Spectral Class  (O → hottest,  M → coolest)')
ax.set_ylabel('Count')
ax.set_xlabel('Spectral Class')
ax.set_ylim(0, spectral_counts.max() + 10)
plt.tight_layout()
plt.savefig('plot6_spectral_class.png')
plt.show()
print("Saved: plot6_spectral_class.png")

# ── 9. Radius vs Luminosity scatter ──────────────────────────
fig, ax = plt.subplots(figsize=(8, 6))
for star_type, group in df.groupby('Star_type_label'):
    ax.scatter(
        group['Radius(R/Ro)'],
        group['Luminosity(L/Lo)'],
        label=star_type,
        color=type_colors[star_type],
        s=60, alpha=0.85, edgecolors='white', linewidths=0.4
    )
ax.set_xscale('log')
ax.set_yscale('log')
ax.set_xlabel('Radius (R/Ro)')
ax.set_ylabel('Luminosity (L/Lo)')
ax.set_title('Radius vs Luminosity')
ax.legend(title='Star Type', bbox_to_anchor=(1.01, 1), loc='upper left', fontsize=10)
plt.tight_layout()
plt.savefig('plot7_radius_vs_luminosity.png', bbox_inches='tight')
plt.show()
print("Saved: plot7_radius_vs_luminosity.png")

# ── 10. Key Findings Summary ─────────────────────────────────
print("\n" + "=" * 50)
print("KEY FINDINGS")
print("=" * 50)

for star_type in order:
    subset = df[df['Star_type_label'] == star_type]
    print(f"\n{star_type} (n={len(subset)})")
    print(f"  Temp:       {subset['Temperature (K)'].mean():>10,.0f} K  (avg)")
    print(f"  Luminosity: {subset['Luminosity(L/Lo)'].median():>10.4f}  (median, L/Lo)")
    print(f"  Radius:     {subset['Radius(R/Ro)'].median():>10.4f}  (median, R/Ro)")
    print(f"  Abs Mag:    {subset['Absolute magnitude(Mv)'].mean():>10.2f}  (avg Mv)")

print("\nAll plots saved to current directory.")
print("Script complete!")
