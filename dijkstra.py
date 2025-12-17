import heapq

def safest_path(graph, start, end):
    pq = [(0, start)]
    risk = {node: float("inf") for node in graph}
    risk[start] = 0
    parent = {}

    while pq:
        current_risk, node = heapq.heappop(pq)

        if node == end:
            break

        for neighbor, weight in graph[node]:
            new_risk = current_risk + weight
            if new_risk < risk[neighbor]:
                risk[neighbor] = new_risk
                parent[neighbor] = node
                heapq.heappush(pq, (new_risk, neighbor))

    path = []
    curr = end
    while curr != start:
        path.append(curr)
        curr = parent.get(curr)
        if curr is None:
            return [], -1

    path.append(start)
    return path[::-1], risk[end]