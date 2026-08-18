# 🚀 navFlux – Lane-Aware Multi-Robot Traffic Control System

navFlux is an intelligent multi-robot traffic simulation system designed to manage robot movement efficiently in structured environments such as warehouses and factories. It uses lane-based rules, congestion awareness, and pathfinding algorithms to ensure smooth and collision-free navigation. 

---

## 🧠 Key Features

- 🚗 Lane-aware robot navigation  
- 🤖 Multi-robot coordination system  
- 📊 Real-time simulation updates  
- 🧭 A* pathfinding algorithm for optimal routing  
- ⚠️ Collision avoidance and traffic control  
- 📡 REST API-based architecture  

---

## ⚙️ Tech Stack

### Frontend
- React / Vite
- JavaScript / HTML / CSS
- Hosted on Vercel

### Backend
- FastAPI (Python)
- Uvicorn server
- Hosted on Render

### Other Tools
- Graph-based simulation logic
- GitHub for version control

---

## 🔗 System Architecture

```

Frontend (Vercel)  --->  Backend API (Render)
|                         |
|------ HTTP Requests ----|

```

---

## 📡 API Base URL

```

[https://navflux.onrender.com](https://navflux.onrender.com)

```

Example:
```

GET /robots
POST /move

```

---

## 📁 Project Structure

```

navFlux/
│
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│
└── README.md

````

---

## ▶️ Run Locally

### 🔹 Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
````

---

### 🔹 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables (Optional)

For frontend:

```
VITE_API_URL=https://navflux.onrender.com
```

---

## ⚠️ Important Notes

* Backend is hosted on free tier → may take a few seconds to wake up
* Ensure CORS is enabled in FastAPI
* Use correct API URL in frontend

---

## 🧪 Testing

You can test backend APIs using:

```
https://navflux.onrender.com/docs
```

(FastAPI Swagger UI)

---

## 🎯 Use Case

* Warehouse automation systems
* Factory robot coordination
* Traffic simulation research
* Multi-agent system development

---

## ⭐ Future Enhancements

* Real-time visualization improvements
* AI-based traffic prediction
* Scalable multi-lane system
* Integration with physical robots

---
