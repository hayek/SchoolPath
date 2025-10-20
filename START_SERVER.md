# How to Run NaviGo Locally

## The Problem
Opening `index.html` directly (file://) causes CORS errors - the browser blocks JavaScript from loading JSON files.

## The Solution
Run a local web server! Choose one of these options:

---

## Option 1: Python (Easiest - Already Installed on Mac)

Open Terminal in the NaviGo folder and run:

```bash
# Python 3 (recommended)
python3 -m http.server 8000

# OR Python 2
python -m SimpleHTTPServer 8000
```

Then open: **http://localhost:8000**

---

## Option 2: Node.js (If you have it installed)

```bash
npx http-server -p 8000
```

Then open: **http://localhost:8000**

---

## Option 3: PHP (Built into Mac)

```bash
php -S localhost:8000
```

Then open: **http://localhost:8000**

---

## Option 4: VS Code Live Server Extension

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

---

## Once the server is running:

- Main page: http://localhost:8000
- Trip creator: http://localhost:8000/creator.html
- Specific trip: http://localhost:8000/trip.html?id=downtown-haifa-tour

Press `Ctrl+C` to stop the server when done.
