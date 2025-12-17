# SheRoutes – AI-Assisted Safety-Aware Women’s Navigation

SheRoutes is a full-stack web application designed to help women navigate safer
routes by prioritizing safety metrics over distance. The system combines
risk-aware graph algorithms with Google Maps visualization and optional AI
assistance for safety awareness.

---

##  Problem Statement
Most navigation systems optimize for shortest distance or time and ignore
personal safety factors. SheRoutes addresses this gap by computing routes that
minimize exposure to unsafe areas.

---

## Features
- Risk-aware route optimization using graph algorithms  
- Modified Dijkstra’s algorithm with priority queues  
- Google Maps route visualization  
- RESTful backend API (FastAPI)  
- Optional AI assistance via Microsoft Copilot for safety guidance  
- Transparent and explainable routing logic  
---

## 🛠 Tech Stack
*Frontend:* HTML, JavaScript, Google Maps API  
*Backend:* Python, FastAPI  
*Algorithms:* Graphs, Dijkstra’s Algorithm, Priority Queues  
*AI Assistance:* Microsoft Copilot (external, user-triggered)

---

## ⚙ How It Works
1. User selects start and destination  
2. Backend computes safest path using risk-weighted Dijkstra’s algorithm  
3. Route is visualized on Google Maps  
4. Users can optionally open an AI assistant for safety guidance  

---
