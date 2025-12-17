from fastapi import FastAPI
from dijkstra import safest_path

app = FastAPI(title="SheRoutes API")

# Risk-weighted graph (sample data)
graph = {
    "Sector 17": [("Sector 22", 2.5), ("Sector 35", 1.2)],
    "Sector 22": [("Sector 43", 3.0)],
    "Sector 35": [("Sector 43", 1.0)],
    "Sector 43": []
}

@app.get("/")
def home():
    return {"message": "SheRoutes backend running"}

@app.get("/route")
def get_safe_route(start: str, end: str):
    path, risk = safest_path(graph, start, end)
    return {
        "safe_path": path,
        "risk_score": risk,
        "logic": "Risk-aware Dijkstra-based route optimization"
}