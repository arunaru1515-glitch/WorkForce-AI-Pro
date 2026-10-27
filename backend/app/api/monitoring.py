import asyncio
import json
import random
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter(tags=["Real-Time Workforce Monitoring (Module 18)"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/workforce")
async def websocket_workforce_monitoring(websocket: WebSocket):
    """
    Module 18: Real-Time Workforce Intelligence WebSocket Stream.
    Broadcasts live biometric shifts, flight-risk recalculations, and HR alerts.
    """
    await manager.connect(websocket)

    # Initial connection welcome packet
    await websocket.send_text(json.dumps({
        "type": "CONNECTION_ESTABLISHED",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "Monitoring Live Workforce Signals",
        "client_count": len(manager.active_connections)
    }))

    sample_events = [
        {"type": "BIOMETRIC_PULSE", "title": "Check-In Verified", "details": "Elena Rostova (Engineering) - Morning Biometrics Registered", "severity": "INFO"},
        {"type": "ATTRITION_CALC", "title": "Risk Re-Evaluation", "details": "Marcus Thorne shift completed (8.5 hrs). Current Flight Risk: 24.5% (LOW)", "severity": "SUCCESS"},
        {"type": "OVERTIME_SURGE", "title": "Shift Overtime Alert", "details": "Engineering unit logged +2.5 cumulative overtime hours today.", "severity": "WARNING"},
        {"type": "LEAVE_SYNC", "title": "Absence Calendar Sync", "details": "Upcoming holiday balance re-computed across all 5 departments.", "severity": "INFO"}
    ]

    try:
        while True:
            # Send periodic live telemetry heartbeat every 8 seconds
            await asyncio.sleep(8)
            evt = random.choice(sample_events)
            packet = {
                **evt,
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "active_headcount": 10,
                "system_health": "Optimal"
            }
            await websocket.send_text(json.dumps(packet))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@router.get("/monitoring/feed")
def get_live_workforce_feed():
    """Module 18: Live Workforce Activity & Telemetry Feed (REST polling endpoint)"""
    return {
        "status": "Online",
        "timestamp": datetime.utcnow().isoformat(),
        "feed": [
            {
                "event_id": "EVT-101",
                "type": "BIOMETRIC_PULSE",
                "title": "Biometric Check-In Verified",
                "employee": "Elena Rostova",
                "department": "Engineering",
                "details": "Morning Biometrics Registered (9:05 AM)",
                "severity": "INFO",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            },
            {
                "event_id": "EVT-102",
                "type": "INSTABILITY_ALERT",
                "title": "Overtime Surge Detected",
                "employee": "Marcus Thorne",
                "department": "Engineering",
                "details": "Engineering overtime surge: +2.5 hrs logged today. Flight-risk escalation pulse triggered.",
                "severity": "WARNING",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            },
            {
                "event_id": "EVT-103",
                "type": "ATTRITION_CALC",
                "title": "Continuous Flight Risk Pulse",
                "employee": "David Kim",
                "department": "Product & Design",
                "details": "Flight risk score recalculated: 54.0% (HIGH) - Below Market Compensation driver.",
                "severity": "WARNING",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            },
            {
                "event_id": "EVT-104",
                "type": "LEAVE_SYNC",
                "title": "Absence & Vacation Synchronized",
                "employee": "Sarah Jenkins",
                "department": "Human Resources",
                "details": "Holiday balances recalculated across all 5 operational business units.",
                "severity": "SUCCESS",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            }
        ]
    }

@router.get("/monitoring/instability-status")
def get_workforce_instability_status():
    """Module 18: Workforce Instability & Overtime Surge Detection"""
    return {
        "instability_detected": True,
        "instability_level": "MODERATE",
        "active_surge_department": "Engineering",
        "overtime_surge_hours": 3.5,
        "critical_flight_risk_count": 1,
        "high_flight_risk_count": 2,
        "system_status": "Active Monitoring",
        "recommendation": "Review workload distribution for Engineering to mitigate overtime-induced flight risk.",
        "assessed_at": datetime.utcnow().isoformat()
    }

