import React, { useState } from "react";
import { Car, MessageSquare, Heart, Shield, LogIn, LogOut, User as UserIcon, PlusCircle, Laptop } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  currentUser: User | null;
  onLogin: (email: string) => Promise<boolean>;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  activeView: string;
  unreadCount: number;
  favoriteCount: number;
}

export default function Navbar({
  currentUser,
  onLogin,
  onLogout,
  onNavigate,
  activeView,
  unreadCount,
  favoriteCount
}: NavbarProps) {
  const [showDemoUserSelector, setShowDemoUserSelector] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const demoAccounts = [
    { email: "kaeufer@autohaus.de", name: "Käufer (Anna S.)", role: "Interessent", icon: "🚗" },
    { email: "max.mustermann@autohaus.de", name: "Max Mustermann", role: "Verkäufer (Standard)", icon: "💼" },
    { email: "admin@autohaus.de", name: "Administrator", role: "Admin Moderation & Stats", icon: "🛡️" }
  ];

  const handleManualLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setErrorMsg("");
    const success = await onLogin(loginEmail);
    if (success) {
      setShowManualLogin(false);
    } else {
      setErrorMsg("E-Mail nicht registriert. Bitte nutzen Sie einen der Demo-Logins oder registrieren Sie sich.");
    }
  };

  const handleDemoSelect = async (email: string) => {
    setErrorMsg("");
    await onLogin(email);
    setShowDemoUserSelector(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Demo Profile Alert Banner */}
      <div className="bg-slate-900 text-xs text-white py-1.5 px-4 flex justify-between items-center select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span><strong>Demo-Modus aktiv:</strong> Testen Sie voreingestellte Profile ohne mühsame Registrierung!</span>
        </div>
        <div className="flex gap-3">
          {demoAccounts.map((demo) => (
            <button
              key={demo.email}
              onClick={() => onLogin(demo.email)}
              className={`hover:text-blue-400 transition-colors font-semibold px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm cursor-pointer ${
                currentUser?.email === demo.email ? "bg-blue-600 text-white" : "text-slate-300"
              }`}
            >
              {demo.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Title */}
          <div 
            onClick={() => onNavigate("browse")} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            id="nav-logo"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight text-slate-800 uppercase block leading-none">
                AUTOHAUS
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                Marktplatz
              </span>
            </div>
          </div>

          {/* Center Navigation Actions */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-btn-browse"
              onClick={() => onNavigate("browse")}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-bold transition-all-custom cursor-pointer ${
                activeView === "browse"
                  ? "bg-slate-100 text-blue-600"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              Inserate stöbern
            </button>

            {currentUser && (
              <>
                <button
                  id="nav-btn-my-listings"
                  onClick={() => onNavigate("my-listings")}
                  className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-bold transition-all-custom cursor-pointer ${
                    activeView === "my-listings"
                      ? "bg-slate-100 text-blue-600"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Meine Fahrzeuge
                </button>
                <button
                  id="nav-btn-create"
                  onClick={() => onNavigate("create-listing")}
                  className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-bold transition-all-custom flex items-center gap-1.5 cursor-pointer ${
                    activeView === "create-listing"
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Auto inserieren
                </button>
              </>
            )}

            {currentUser?.isAdmin && (
              <button
                id="nav-btn-admin"
                onClick={() => onNavigate("admin")}
                className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-bold transition-all-custom flex items-center gap-1.5 cursor-pointer ${
                  activeView === "admin"
                    ? "bg-slate-100 text-amber-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Moderation & Stats
              </button>
            )}
          </nav>

          {/* Right Section Tools */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                {/* Favorites Trigger */}
                <button
                  id="nav-btn-favorites"
                  onClick={() => onNavigate("favorites")}
                  className={`p-2 rounded transition-all-custom cursor-pointer relative ${
                    activeView === "favorites"
                      ? "bg-slate-100 text-rose-600"
                      : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                  title="Merkliste"
                >
                  <Heart className={`w-4 h-4 ${activeView === "favorites" ? "fill-rose-500" : ""}`} />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                      {favoriteCount}
                    </span>
                  )}
                </button>

                {/* Inbox Messenger Trigger */}
                <button
                  id="nav-btn-chats"
                  onClick={() => onNavigate("chats")}
                  className={`p-2 rounded transition-all-custom cursor-pointer relative ${
                    activeView === "chats"
                      ? "bg-slate-100 text-blue-600"
                      : "text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                  title="Nachrichten"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* User Dropdown Profile Container */}
                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-2 pl-1">
                  <button
                    id="nav-btn-profile"
                    onClick={() => onNavigate("profile")}
                    className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left"
                  >
                    <img
                      src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.name}`}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded border border-slate-200 object-cover bg-slate-50"
                    />
                    <div className="hidden lg:block">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-none">
                        {currentUser.name}
                      </p>
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        {currentUser.isAdmin ? "Haupt-Admin" : "Nutzer"}
                      </span>
                    </div>
                  </button>

                  <button
                    id="nav-btn-logout"
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-50 cursor-pointer transition-colors"
                    title="Abmelden"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-btn-login-trigger"
                  onClick={() => setShowManualLogin(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Anmelden
                </button>
                <button
                  id="nav-btn-register-trigger"
                  onClick={() => {
                    onNavigate("profile");
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
                >
                  Registrieren
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Login Modal */}
      {showManualLogin && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans font-bold text-lg text-slate-800 uppercase tracking-tight">Einloggen / Anmelden</h3>
              <button
                onClick={() => setShowManualLogin(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold p-1 line-clamp-1"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleManualLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Geben Sie Ihre registrierte E-Mail-Adresse ein:
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                  required
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2.5 rounded">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-colors"
              >
                In Ihr Profil einloggen
              </button>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                Oder wählen Sie ein Demo-Konto:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map((demo) => (
                  <button
                    key={demo.email}
                    onClick={() => handleDemoSelect(demo.email)}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-slate-50 rounded transition-all-custom cursor-pointer"
                  >
                    <span className="text-2xl">{demo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-none mb-1">
                        {demo.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate leading-none mb-1">
                        {demo.email}
                      </p>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                        {demo.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
