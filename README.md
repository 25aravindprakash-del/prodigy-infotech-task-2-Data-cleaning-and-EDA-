# RMS Titanic Passenger Register & Historical Ledger

This repository contains the reconstructed historical logs, demographic profile analysis, and survival visualizations for the passengers aboard the RMS Titanic during its maiden voyage in April 1912. It features a Jupyter Notebook detailing record reconciliation and an interactive web ledger designed in a vintage green, white, and red theme.

## Repository Contents

- `process_data.py`: A Python script that executes the data reconciliation pipeline and aggregates passenger stats for the web ledger (`cleaned_data.json`).
- `EDA_Notebook.ipynb`: A research notebook mapping the loading, cleaning, and custom visualization of passenger demographic survival rates.
- `index.html`, `style.css`, `app.js`: A responsive, antique-themed interactive registry showing statistics, data reconciliation logs, and an demographic profile estimator.

## Record Reconciliation Overview

1. **Age**: Restored 177 missing entries using the median passenger age (28.0) to maintain consistent distributions.
2. **Embarked**: Filled missing boarding locations with the Southampton mode ('S').
3. **Deck Positions**: Grouped passenger cabins by deck letters (A-G) extracted from room codes to locate positioning relative to life-rafts.
4. **Family Profiles**: Compiled sibling/spouse and parent/child counts into a single FamilySize dimension.

## Execution Guide

### 1. Prerequisites
Install dependencies:
```bash
pip install pandas numpy matplotlib seaborn
```

### 2. Update Ledger Data
To execute the data processing pipeline:
```bash
python process_data.py
```

### 3. Serve the Web Registry
Launch a local web server to display the interactive passenger register:
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.
