# 🚛 FleetOps v2.0 — Upgraded

Full-stack Fleet Management System with Authentication, Premium Plans, PWA, and Responsive Design.

---

## 🆕 What's New in v2.0

| Feature | Details |
|---|---|
| 🔐 Auth System | Register, Login with JWT tokens. Sessions persist via localStorage |
| 👤 Account-Based | Each user's data is isolated. Trucks/drivers/trips belong to the logged-in user |
| 💎 Free / Premium | Free: 5 trucks, 10 drivers. Premium: Unlimited + route planner + fleet map |
| 📱 Responsive | Mobile sidebar with hamburger menu, tablet + desktop layouts |
| 📲 PWA | Installable as app on Android/iOS/Desktop with offline support |
| 🗺 Route Planner | Location autocomplete (Nominatim) + distance calculator (Premium) |
| 🔔 Toast Alerts | In-app notifications for all actions |

---

## 📁 File Structure

```
fleetops/
├── backend/
│   ├── app.py              ← Flask API (full auth + all routes)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── index.html      ← PWA meta tags
│   │   └── manifest.json   ← PWA manifest
│   └── src/
│       ├── App.js          ← Full React app (single file)
│       ├── index.js        ← SW registration
│       └── serviceWorkerRegistration.js
└── README.md
```

---

## 🚀 Setup — Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your SECRET_KEY and JWT_SECRET_KEY

# Run
python app.py
# → Runs on http://localhost:5000
```

---

## ⚛️ Setup — Frontend

```bash
cd frontend

# Install
npm install

# Set backend URL
# Create .env file:
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Run
npm start
# → Runs on http://localhost:3000
```

---

## 🌐 Deployment (Render.com)

### Backend (Web Service)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`
- **Environment Variables:**
  - `SECRET_KEY` = (random 32-char string)
  - `JWT_SECRET_KEY` = (another random string)
  - `FRONTEND_URL` = your frontend URL
  - `DATABASE_URL` = (for PostgreSQL in prod, optional)

### Frontend (Static Site)
- **Build Command:** `npm run build`
- **Publish Directory:** `build`
- **Environment Variables:**
  - `REACT_APP_API_URL` = your backend URL + `/api`

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | None | Create account |
| POST | `/api/login` | None | Login, get JWT |
| GET | `/api/profile` | JWT | Get profile |
| PUT | `/api/profile` | JWT | Update profile |
| POST | `/api/upgrade` | JWT | Upgrade plan |
| GET | `/api/packages` | None | List packages |

### Fleet (all require JWT)
| Method | Endpoint | Premium | Description |
|---|---|---|---|
| GET/POST | `/api/trucks` | No | List/create trucks |
| PUT/DELETE | `/api/trucks/<id>` | No | Update/delete truck |
| GET/POST | `/api/drivers` | No | List/create drivers |
| PUT/DELETE | `/api/drivers/<id>` | No | Update/delete driver |
| GET/POST | `/api/trips` | No | List/create trips |
| PUT | `/api/trips/<id>/status` | No | Update trip status |
| GET | `/api/fleet/locations` | **Yes** | Live fleet map |
| GET | `/api/dashboard` | No | Stats overview |
| POST | `/api/seed` | No | Load sample data |

---

## 💎 Free vs Premium

| Feature | Free | Premium |
|---|---|---|
| Trucks | Up to 5 | Unlimited |
| Drivers | Up to 10 | Unlimited |
| Trips | Unlimited | Unlimited |
| Dashboard | ✅ | ✅ |
| Route Planner | ❌ | ✅ |
| Fleet Map | ❌ | ✅ |
| Price | ₹0 | ₹999/month |

---

## 📲 PWA Installation

On mobile, visit the app URL and tap "Add to Home Screen" in the browser menu.
On desktop Chrome, click the install icon in the address bar.

---

## ⚠️ Notes for Production

1. **Change SECRET_KEY and JWT_SECRET_KEY** — never use defaults
2. **Use PostgreSQL** instead of SQLite for production
3. **Payment integration** — replace the demo upgrade flow with Razorpay/Stripe
4. **HTTPS required** for PWA features (Render provides it for free)
5. **Update CORS origins** in `app.py` to match your frontend domain

## 🌐 Current Tunnel URL
https://demand-reads-ear-portfolio.trycloudflare.com

## 🌐 Current Tunnel URL
https://psi-territory-father-discovery.trycloudflare.com

## 🌐 Current Tunnel URL
https://gain-researcher-expressions-trading.trycloudflare.com
