# Grade Prediction System (React + Vite + Express)

A small full-stack app that predicts a student’s grade in a target course using k-Nearest Neighbors (KNN).  
Frontend is React (Vite + HMR). Backend is Node/Express with CSV-backed data.

## ✨ Features

- Upload **Students / Courses / Transcripts** CSVs
- Manually add/edit rows in the UI
- **Predict grades** using KNN (local vectors + backend fallback)
- Validation + in-app notifications
- Export CSVs
- Data persisted in **localStorage** (frontend) and CSV files (backend)

---

## 🧰 Tech Stack

- **Frontend:** React 18, Vite, Tailwind (styles already in project), lucide-react, PapaParse
- **Backend:** Node 18+, Express, zod
- **Language:** JavaScript (ESM)
- **Linting:** ESLint (optional rules included)

---

## ⚙️ Requirements

- **Node.js** ≥ 18
- **npm** ≥ 9 (or **pnpm**/**yarn** if you prefer)

> Check versions:
```bash
node -v
npm -v
```

---

## 📦 Project Structure

```
.
├── frontend/                 # React + Vite app
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/...
│   └── vite.config.js
└── backend/                  # Express API + KNN
    ├── package.json
    ├── src/
    │   ├── server.js         # main server (Express)
    │   ├── lib/
    │   │   ├── data.js       # CSV loader & vector build
    │   │   ├── knn.js        # KNN predict
    │   │   └── math.js       # cosine similarity
    │   └── smoke-test.mjs    # quick API test
    └── data/
        ├── students.csv
        ├── courses.csv
        └── transcripts.csv
```

---

## 🛠️ Setup & Install

Clone the repo, then install **both** apps:

```bash
git clone <YOUR_REPO_URL> grade-prediction-system
cd grade-prediction-system
```

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
cd ../backend
npm install
```

---

## 🔑 Environment Variables

### Backend (`backend/.env` – optional)
```
PORT=3000
DATA_DIR=./data
```

If omitted, `PORT=3000` and `DATA_DIR=./data` are used by default.

### Frontend (`frontend/.env` – optional)
```
VITE_API_URL=http://localhost:3000
```
If omitted, the app defaults to `http://localhost:3000`.

---

## ▶️ Running in Development

Open **two terminals** (or use the “Run both” option below).

### 1) Start the backend (Express)
```bash
cd backend
npm run dev
# or: npm start  (if you prefer without file watching)
# Server → http://localhost:3000
```

You should see logs similar to:
```
[data] courses=40 students=300 transcripts(raw)=3577
[data] studentVectors=300 takers(courses)=40
KNN API on http://localhost:3000
```

### 2) Start the frontend (Vite)
```bash
cd ../frontend
npm run dev
# Vite → http://localhost:5173
```

Open the browser at **http://localhost:5173**.

### (Optional) Run both with one command

From the repository root:

```bash
npm install -g concurrently # or use npx concurrently
npx concurrently -n API,WEB -c yellow,cyan "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## 🧪 Backend Smoke Test (optional)

Verify the `/predict` endpoint quickly:

```bash
cd backend
node src/smoke-test.mjs
```

You should see either a successful prediction or a helpful validation message.  
If you get “no neighbors”, it means your CSV set has no overlapping students/courses for the sample query—try different course codes or add more transcript rows.

---

## 📡 API (Backend)

### `POST /predict`
**Body**
```json
{
  "studentGrades": [
    { "courseCode": "ENG102", "grade": 88 },
    { "courseCode": "MATH201", "grade": 76 }
  ],
  "targetCourseCode": "CS102",
  "k": 7,
  "minCommonCourses": 2
}
```

**Response**
```json
{
  "targetCourse": { "id": "CRS037", "code": "CS102" },
  "predictedGrade": 83.2,
  "confidence": 71,
  "k": 5,
  "neighbors": [
    { "studentId": "STU0123", "similarity": 0.82, "overlap": 2, "theirGrade": 85.0 }
  ]
}
```

**Debug routes (optional, if enabled in your server):**
- `GET /health`
- `POST /debug/reload` – reload CSVs from `DATA_DIR`
- `GET /debug/code/:code` – see which courseId is chosen when duplicates exist
- `GET /debug/dupes` – list duplicate course codes and their courseIds

---

## 📄 CSV Schemas

**students.csv**
```
studentId,firstName,lastName,email,program,startYear
STU0001,Roni,Moyal,roni@example.edu,Psychology,2024
...
```

**courses.csv**
```
courseId,code,name,credits,type,department,level,difficulty
CRS037,CS102,CS Course 102,2,Core,CS,Undergraduate,3
...
```

**transcripts.csv**
```
studentId,courseId,grade,term,year,attemptNo
STU0001,CRS037,78,Spring,2024,1
...
```

> The backend resolves `courseCode → courseId`. If a code appears multiple times (duplicates), the loader picks one (and logs a warning). Use `/debug/dupes` to inspect.

---

## 🏗️ Production Build

### Frontend
```bash
cd frontend
npm run build        # outputs to dist/
npm run preview      # serve the build locally
```

Deploy `frontend/dist` to any static host (Netlify, Vercel, GitHub Pages).  
Set `VITE_API_URL` at build time to point to your backend.

### Backend
Run on any Node host:

```bash
cd backend
npm install --production
npm start
# or with PM2:
# pm2 start src/server.js --name grade-api
```

Ensure `DATA_DIR` contains the three CSVs and `PORT` is open.

---

## 🧹 ESLint (optional)

The template already includes basic ESLint. To expand to type-aware rules, consider migrating to TypeScript and `typescript-eslint`.

```bash
# minimal extras if you want them
cd frontend
npm i -D eslint eslint-plugin-react eslint-plugin-react-hooks

cd ../backend
npm i -D eslint
```

---

## 🐞 Troubleshooting

- **Frontend can’t reach backend:**  
  - Make sure backend is on `http://localhost:3000` or set `VITE_API_URL` correctly.
  - Check CORS (backend enables CORS by default).

- **“Prediction failed: Unknown targetCourseCode”:**  
  - Verify the **target course code** exists in `courses.csv`.
  - Use `/debug/code/:code` to see which `courseId` is mapped.

- **“neighbors = 0” or confidence 0%:**  
  - Your dataset may not have enough overlapping students who took the target course. Add more transcript rows or reduce `k`/`minCommonCourses`.

- **Duplicate course codes warnings:**  
  - The loader selects one courseId for a duplicate code. Inspect `/debug/dupes` and clean up CSVs if needed.

---

## 📜 License

MIT (or whatever you prefer)

---

### Quick Start (TL;DR)

```bash
# Terminal 1
cd backend
npm install
npm run dev   # http://localhost:3000

# Terminal 2
cd frontend
npm install
npm run dev   # http://localhost:5173
```
