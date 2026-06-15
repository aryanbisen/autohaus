import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Calendar, HelpCircle, User, ArrowLeft, Fuel, Compass, Sparkles } from "lucide-react";
import { Chat, Message, User as UserType } from "../types";

interface ChatInboxProps {
  currentUser: UserType | null;
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  onSelectChat: (chat: Chat) => void;
  onSendMessage: (receiverId: string, listingId: string, content: string) => Promise<boolean>;
  onRefreshChatsAndMessages: () => void;
}

const CHAT_QUICK_SUGGESTIONS = [
  "Wann wäre eine Besichtigung und Probefahrt möglich?",
  "Ist das Fahrzeug unfallfrei und scheckheftgepflegt?",
  "Bieten Sie auch eine Finanzierung oder Inzahlungnahme an?",
  "Wie lange hat das Auto noch TÜV?",
  "Was ist Ihre Schmerzgrenze beim Preis?"
];

export default function ChatInbox({
  currentUser,
  chats,
  activeChat,
  messages,
  onSelectChat,
  onSendMessage,
  onRefreshChatsAndMessages
}: ChatInboxProps) {
  const [typedText, setTypedText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages in active chat to simulate real-time checking
  useEffect(() => {
    onRefreshChatsAndMessages();
    const interval = setInterval(() => {
      onRefreshChatsAndMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChat?.id]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeChat || !typedText.trim()) return;

    await sendChatMsg(typedText.trim());
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await sendChatMsg(suggestion);
  };

  const sendChatMsg = async (text: string) => {
    if (!currentUser || !activeChat) return;

    setSending(true);
    // Determine recipient
    const receiverId = activeChat.sellerId === currentUser.id ? activeChat.buyerId : activeChat.sellerId;
    
    try {
      const success = await onSendMessage(receiverId, activeChat.listingId, text);
      if (success) {
        setTypedText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const hasUnread = (chat: Chat) => {
    if (!currentUser || !chat.unreadCount) return false;
    return (chat.unreadCount[currentUser.id] || 0) > 0;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-210px)] min-h-[500px] flex animate-in fade-in duration-200">
      
      {/* Left Columns - Conversations list */}
      <div className={`w-full md:w-85 border-r border-slate-100 flex flex-col ${activeChat ? "hidden md:flex" : "flex"}`}>
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-500" />
            Nachrichten-Postfach
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Echtzeit-Kommunikation mit Ihren Käufern & Verkäufern.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Keine Nachrichten vorhanden</p>
              <p className="text-[10px] text-slate-400 max-w-[180px] mt-1">
                Sobald Sie ein Inserat anfragen oder Anfragen erhalten, finden Sie diese hier.
              </p>
            </div>
          ) : (
            chats.map((chat) => {
              const isUnread = hasUnread(chat);
              const partnerName = chat.sellerId === currentUser?.id ? chat.buyerName : chat.sellerName;
              const isPartnerSeller = chat.sellerId !== currentUser?.id;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`w-full flex gap-3.5 p-4 text-left transition-colors cursor-pointer relative ${
                    activeChat?.id === chat.id
                      ? "bg-sky-50/40 border-l-4 border-sky-500 pl-3"
                      : "hover:bg-slate-50 border-l-4 border-transparent"
                  }`}
                >
                  <img
                    src={chat.listingImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover bg-slate-50 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-xs truncate ${isUnread ? "font-extrabold text-slate-950" : "font-bold text-slate-800"}`}>
                        {partnerName}
                      </p>
                      <span className="text-[9px] font-mono text-slate-400">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono font-bold text-slate-500 truncate mb-1 leading-none mt-1">
                      {chat.listingBrand} {chat.listingModel} • {formatPrice(chat.listingPrice)}
                    </p>

                    <p className={`text-xs truncate ${isUnread ? "font-medium text-slate-900" : "text-slate-400"}`}>
                      {chat.lastMessageText}
                    </p>
                  </div>

                  {isUnread && (
                    <span className="absolute right-4 bottom-4 w-2.5 h-2.5 bg-sky-500 rounded-full animate-ping"></span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column - Conversational flow */}
      <div className={`flex-1 flex flex-col ${!activeChat ? "hidden md:flex justify-center items-center bg-slate-50/50" : "flex"}`}>
        {activeChat ? (
          <>
            {/* Thread Header details */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
              <button
                onClick={() => onRefreshChatsAndMessages()} // Go back conceptually
                className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <img
                src={activeChat.listingImage}
                alt=""
                className="w-10 h-10 rounded-xl object-cover bg-slate-50"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-xs text-slate-800 leading-none">
                  Besprechung: {activeChat.listingBrand} {activeChat.listingModel}
                </h3>
                <span className="text-[10px] font-mono font-semibold text-sky-600">
                  Preis: {formatPrice(activeChat.listingPrice)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-2">• Partner: {activeChat.sellerId === currentUser?.id ? activeChat.buyerName : activeChat.sellerName}</span>
              </div>
            </div>

            {/* Micro chat bubbles scroll timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/20">
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
                  >
                    <div className="max-w-[72%]">
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMine
                            ? "bg-slate-900 text-white rounded-tr-xs"
                            : "bg-white border border-slate-100 text-slate-800 rounded-tl-xs shadow-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className={`block text-[9px] font-mono text-slate-400 mt-1 ${isMine ? "text-right" : "text-left"}`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick response suggestions block (Only when I am buying) */}
            {activeChat.buyerId === currentUser?.id && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 w-full mb-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Schnelle Fragen senden:
                </span>
                {CHAT_QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-full hover:border-sky-500 hover:text-sky-600 transition-colors cursor-pointer block truncate max-w-[340px]"
                    title={suggestion}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Form Input submit panel */}
            <form onSubmit={handleSendSubmit} className="p-4 border-t border-slate-100 bg-white flex gap-3">
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Schreiben Sie Ihre Nachricht hier..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                required
              />
              <button
                type="submit"
                disabled={sending || !typedText.trim()}
                className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="text-center p-8 flex flex-col items-center justify-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
            <h3 className="font-display font-bold text-sm text-slate-700">Keine Konversation ausgewählt</h3>
            <p className="text-xs text-slate-400 max-w-[240px] mt-1 text-center">
              Wählen Sie links einen Chat aus dem Postfach aus, um die Nachrichten anzuzeigen und zu antworten.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
