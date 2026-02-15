# AttendEase - IIEST Attendance Tracker

AttendEase is a web application designed to track student attendance for IIEST Shibpur. It uses a **FastAPI (Python)** backend and a **Next.js (React)** frontend, integrated with **Firebase** for data storage and **Google OAuth** for authentication.

## Architecture

*   **Backend**: Python (FastAPI), Firebase Admin SDK
*   **Frontend**: TypeScript, Next.js, Tailwind CSS, Shadcn UI
*   **Database**: Firestore (NoSQL)
*   **Auth**: Google OAuth 2.0 + Firebase Auth

---

## 🚀 Getting Started

### Prerequisites

*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)
*   [Firebase Project](https://console.firebase.google.com/)

---

### 1. External Service Setup

#### A. Firebase Console
1.  Create a new Firebase Project.
2.  Enable **Authentication** (Google Sign-In).
3.  Enable **Firestore Database** (Start in production mode).
4.  **Download Service Account Key**:
    *   Project Settings -> Service accounts -> Generate new private key.
    *   Save this file as `serviceAccountKey.json`.
5.  **Get Client Config**:
    *   Project Settings -> General -> Your apps -> Web App -> SDK setup and configuration.
    *   Keep these keys handy for the frontend.

#### B. Google Cloud Console (OAuth)
1.  Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2.  Create **OAuth 2.0 Client ID** (Web application).
3.  Set **Authorized JavaScript origins**: `http://localhost:8000` (Backend URL)
4.  Set **Authorized redirect URIs**: `http://localhost:8000/auth/callback`
5.  Copy your **Client ID** and **Client Secret**.

---

### 2. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Configure Environment:
    *   Rename `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Move your `serviceAccountKey.json` into the `backend/` folder.
    *   Edit `.env` and fill in:
        *   `GOOGLE_CLIENT_ID`
        *   `GOOGLE_CLIENT_SECRET`
        *   `GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json`
        *   `FRONTEND_URL=http://localhost:9002`

5.  Run the Backend Server:
    ```bash
    python -m uvicorn main:app --reload
    ```
    The server will start at `http://localhost:8000`.

---

### 3. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    *   Rename `.env.local.example` to `.env.local`:
        ```bash
        cp .env.local.example .env.local
        ```
    *   Edit `.env.local` and fill in your Firebase Client Config keys.

4.  Run the Frontend:
    ```bash
    npm run dev
    ```
    The app will verify at `http://localhost:9002` (or whatever port Next.js picks).

---

## 🛠️ Usage

1.  Open the frontend URL (e.g., `http://localhost:9002`).
2.  Click **"Sign in with Google"**.
3.  Complete your profile (Year, Branch, Roll Number).
4.  **View Schedule**: See your daily classes.
5.  **Mark Attendance**: Click "P" (Present), "A" (Absent), or "C" (Cancelled) on any class card.
    *   Stats update instantly.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
