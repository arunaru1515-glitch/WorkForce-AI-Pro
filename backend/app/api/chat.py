from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Dict
import json
from app.database import get_db, SessionLocal
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatUserSummary
from app.core.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["7. Chat & Documents"])

# WebSocket Connection Manager for Real-time messaging
class ConnectionManager:
    def __init__(self):
        # Maps user_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

manager = ConnectionManager()

def format_chat_response(msg: ChatMessage) -> ChatMessageResponse:
    sender_name = msg.sender.full_name if msg.sender else f"User {msg.sender_id}"
    receiver_name = msg.receiver.full_name if msg.receiver else f"User {msg.receiver_id}"
    return ChatMessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        sender_name=sender_name,
        receiver_id=msg.receiver_id,
        receiver_name=receiver_name,
        message=msg.message,
        is_read=msg.is_read,
        created_at=msg.created_at
    )

@router.get("/users", response_model=List[ChatUserSummary])
def get_chat_users(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 8: List colleagues available to message with unread message badges"""
    all_users = db.query(User).filter(User.id != current_user.id, User.is_active == True).all()
    summaries = []
    for u in all_users:
        unread = db.query(ChatMessage).filter(
            ChatMessage.sender_id == u.id,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.is_read == False
        ).count()
        summaries.append(ChatUserSummary(
            user_id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role.value if hasattr(u.role, 'value') else str(u.role),
            unread_count=unread
        ))
    return summaries

@router.get("/history/{other_user_id}", response_model=List[ChatMessageResponse])
def get_chat_history(other_user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 8: Chat history between current user and target user + mark as read"""
    # Mark messages sent to me by other user as read
    db.query(ChatMessage).filter(
        ChatMessage.sender_id == other_user_id,
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()

    messages = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return [format_chat_response(m) for m in messages]

@router.post("/send", response_model=ChatMessageResponse)
async def send_message(msg_in: ChatMessageCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 8: Send 1-on-1 message and broadcast via WebSocket"""
    recipient = db.query(User).filter(User.id == msg_in.receiver_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")
        
    chat_msg = ChatMessage(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        message=msg_in.message,
        is_read=False
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)
    
    resp_data = format_chat_response(chat_msg)
    # Broadcast to recipient via WebSocket in real-time
    await manager.send_personal_message(resp_data.model_dump(mode="json"), msg_in.receiver_id)
    return resp_data

@router.websocket("/ws/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: int):
    """Module 8: Real-time WebSocket connection for instant chat & notifications"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat or client messages
            try:
                msg_payload = json.loads(data)
                if msg_payload.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
