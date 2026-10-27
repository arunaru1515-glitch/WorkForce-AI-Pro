import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCheck } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const res = await chatAPI.getUsers();
      setUsers(res.data);
      if (res.data.length > 0 && !selectedUser) {
        setSelectedUser(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (userId) => {
    if (!userId) return;
    try {
      const res = await chatAPI.getHistory(userId);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      fetchHistory(selectedUser.user_id);
      const interval = setInterval(() => fetchHistory(selectedUser.user_id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;
    const text = inputText;
    setInputText('');
    try {
      const res = await chatAPI.sendMessage(selectedUser.user_id, text);
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      alert("Failed to deliver message");
    }
  };

  return (
    <div className="w-full px-6 py-5 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h2>
        <p className="text-xs text-slate-500 mt-0.5">Direct workplace messaging between team members, managers, and HR.</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex">
        {/* User Sidebar */}
        <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-200">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Members</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 text-xs text-slate-400 text-center">Loading colleagues...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">No other active colleagues.</div>
            ) : (
              users.map((u) => {
                const isSelected = selectedUser?.user_id === u.user_id;
                return (
                  <div
                    key={u.user_id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 border-l-3 border-indigo-600' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {u.full_name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 truncate">{u.full_name}</div>
                        <div className="text-[10px] text-slate-500">{u.role}</div>
                      </div>
                    </div>
                    {u.unread_count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                        {u.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation Pane */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {selectedUser.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{selectedUser.full_name}</div>
                    <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No messages yet. Send a greeting to begin!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-br-xs' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}>
                          <div>{m.message}</div>
                          <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 flex items-center gap-2 bg-white">
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.full_name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a colleague from the left panel to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
