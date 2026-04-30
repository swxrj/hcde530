"""
Download the HEASARC dump of the ATNF Pulsar Catalog (atnfpulsar) and save
it as a CSV in this folder.

Source: https://heasarc.gsfc.nasa.gov/FTP/heasarc/dbase/dump/heasarc_atnfpulsar.tdat.gz
Docs:   https://heasarc.gsfc.nasa.gov/W3Browse/radio-catalog/atnfpulsar.html

Run from the Week 5 directory:
    python fetch_heasarc_atnf_pulsar.py
"""

import gzip
import os
import shutil
import urllib.request

import pandas as pd

DUMP_URL = "https://heasarc.gsfc.nasa.gov/FTP/heasarc/dbase/dump/heasarc_atnfpulsar.tdat.gz"
GZ_NAME = "heasarc_atnfpulsar.tdat.gz"
TDAT_NAME = "heasarc_atnfpulsar.tdat"
OUT_CSV = "atnf_pulsar_heasarc.csv"


def download(url: str, dest: str) -> None:
    print(f"Downloading {url} ...")
    urllib.request.urlretrieve(url, dest)
    print(f"Saved {dest}")


def gunzip(src: str, dest: str) -> None:
    print(f"Decompressing {src} -> {dest}")
    with gzip.open(src, "rb") as f_in, open(dest, "wb") as f_out:
        shutil.copyfileobj(f_in, f_out)


def parse_tdat(path: str) -> pd.DataFrame:
    """Read HEASARC .tdat dump: metadata lines, then <DATA> pipe-separated rows."""
    columns = None
    data_lines = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("line[1] = "):
                columns = line.split("=", 1)[1].strip().split()
            if line.startswith("<DATA>"):
                break
        if not columns:
            raise ValueError("Could not find column list (line[1] = ...) in tdat file.")

        for line in f:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            parts = line.split("|")
            while len(parts) > len(columns) and parts[-1] == "":
                parts.pop()
            if len(parts) != len(columns):
                print(f"Skipping malformed row ({len(parts)} fields, expected {len(columns)}).")
                continue
            data_lines.append(parts)

    return pd.DataFrame(data_lines, columns=columns)


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)

    gz_path = os.path.join(here, GZ_NAME)
    tdat_path = os.path.join(here, TDAT_NAME)
    out_path = os.path.join(here, OUT_CSV)

    if not os.path.isfile(tdat_path):
        download(DUMP_URL, gz_path)
        gunzip(gz_path, tdat_path)
        os.remove(gz_path)

    df = parse_tdat(tdat_path)
    df.to_csv(out_path, index=False)
    print(f"Wrote {out_path} ({len(df)} rows, {len(df.columns)} columns)")


if __name__ == "__main__":
    main()
