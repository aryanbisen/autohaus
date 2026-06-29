import React, { useState, useEffect } from "react";
import { 
  Car, Search, SlidersHorizontal, BookOpen, AlertCircle, Sparkles, Heart, Check, 
  MessageSquare, User as UserIcon, HelpCircle, ArrowRight, Compass, LogIn, PlusCircle 
} from "lucide-react";

import { User, Listing, Message, Chat, AdminStats } from "./types";
import Navbar from "./components/Navbar";
import ListingCard from "./components/ListingCard";
import ListingDetail from "./components/ListingDetail";
import ListingForm from "./components/ListingForm";
import ChatInbox from "./components/ChatInbox";
import ProfilePanel from "./components/ProfilePanel";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Navigation
  const [activeView, setActiveView] = useState<string>("browse");

  // Authentication coordinates
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regError, setRegError] = useState<string>("");
  const [regSuccess, setRegSuccess] = useState<string>("");

  // Storage
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Admin directories
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Active overlays
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editListing, setEditListing] = useState<Listing | null>(null);

  // Filter scales
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("Alle");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minYear, setMinYear] = useState<string>("");
  const [maxYear, setMaxYear] = useState<string>("");
  const [maxMileage, setMaxMileage] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Base list of brands for pills filter
  const BRANDS = ["Alle", "Porsche", "BMW", "VW", "Tesla", "Mercedes", "Audi"];

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("autohaus_current_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        fetchUserData(user);
      } catch (err) {
        localStorage.removeItem("autohaus_current_user");
      }
    }
    fetchListings();
  }, []);

  // Fetch active directory listings from backend
  const fetchListings = async () => {
    try {
      const resp = await fetch("/api/listings");
      if (resp.ok) {
        const data = await resp.json();
        setListings(data);
      }
    } catch (err) {
      console.error("Failed to fetch listings", err);
    }
  };

  // Sync favorites & chat streams when user logs in or views change
  const fetchUserData = async (u: User) => {
    if (!u) return;
    try {
      // 1. Fetch Favorites
      const favResp = await fetch(`/api/favorites?userId=${u.id}`);
      if (favResp.ok) {
        setFavorites(await favResp.json());
      }

      // 2. Fetch User Chats inbox
      const chatsResp = await fetch(`/api/chats?userId=${u.id}`);
      if (chatsResp.ok) {
        setChats(await chatsResp.json());
      }

      // 3. Fetch Admin logs if appropriate
      if (u.isAdmin) {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Error fetching user data", err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const usersResp = await fetch("/api/admin/users");
      const statsResp = await fetch("/api/admin/stats");
      if (usersResp.ok) {
        setAdminUsers(await usersResp.json());
      }
      if (statsResp.ok) {
        setAdminStats(await statsResp.json());
      }
    } catch (err) {
      console.error("Admin data loading failed", err);
    }
  };

  // Login handler
  const handleLoginSubmit = async (emailString: string, passwordString?: string): Promise<boolean> => {
    try {
      const payload: any = { email: emailString };
      if (passwordString) {
        payload.password = passwordString;
      }
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const user: User = await resp.json();
        setCurrentUser(user);
        localStorage.setItem("autohaus_current_user", JSON.stringify(user));
        fetchUserData(user);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Register helper
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError("Name, E-Mail-Adresse und Passwort sind Pflichtfelder!");
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword.trim()
        })
      });

      if (resp.ok) {
        const newUser: User = await resp.json();
        setRegSuccess("Registrierung erfolgreich! Starten des Logins...");
        
        // Auto Login
        setCurrentUser(newUser);
        localStorage.setItem("autohaus_current_user", JSON.stringify(newUser));
        fetchUserData(newUser);
        
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegPassword("");
        setIsRegistering(false);
        setActiveView("browse");
      } else {
        const data = await resp.json();
        setRegError(data.error || "Es gab einen Fehler bei der Registrierung.");
      }
    } catch (err) {
      setRegError("Serverfehler beim Registrieren.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("autohaus_current_user");
    setFavorites([]);
    setChats([]);
    setActiveChat(null);
    setMessages([]);
    setActiveView("browse");
  };

  // Navigation controller
  const handleNavigationChange = (view: string) => {
    setRegError("");
    setRegSuccess("");
    setIsRegistering(false);
    setActiveView(view);
    
    // Refresh lists
    fetchListings();
    if (currentUser) {
      fetchUserData(currentUser);
    }
  };

  // Profile data updates handler
  const handleProfileUpdate = async (name: string, phone: string, avatarUrl?: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const resp = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, name, phone, avatarUrl })
      });

      if (resp.ok) {
        const updated: User = await resp.json();
        setCurrentUser(updated);
        localStorage.setItem("autohaus_current_user", JSON.stringify(updated));
        fetchListings();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Create or Edit Cars
  const handleListingCreateOrEdit = async (formData: any): Promise<boolean> => {
    if (!currentUser) return false;
    
    const isEditing = editListing !== null;
    const url = isEditing ? `/api/listings/${editListing.id}` : "/api/listings";
    const method = isEditing ? "PUT" : "POST";

    const payload = {
      ...formData,
      sellerId: currentUser.id,
      location: formData.sellerLocation // Sync custom location naming
    };

    try {
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        fetchListings();
        setEditListing(null);
        setActiveView("my-listings");
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Bookmarks bookmark heart toggles
  const handleBookmarkToggle = async (e: React.MouseEvent | null, listingId: string) => {
    if (e) {
      e.stopPropagation();
    }
    if (!currentUser) {
      setActiveView("profile"); // Navigate to registration
      return;
    }

    try {
      const resp = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, listingId })
      });

      if (resp.ok) {
        if (currentUser) {
          fetchUserData(currentUser);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Message dispatcher
  const handleSendMessage = async (receiverId: string, listingId: string, content: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const resp = await fetch("/api/chats/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId,
          listingId,
          content
        })
      });

      if (resp.ok) {
        const body = await resp.json();
        const activeChatFlow = body.chat;
        
        // Refresh chats list & pull messages in active dialogue
        fetchUserData(currentUser);
        if (activeChat && activeChat.id === activeChatFlow.id) {
          fetchChatMessages(activeChatFlow.id);
        } else {
          setActiveChat(activeChatFlow);
          fetchChatMessages(activeChatFlow.id);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    try {
      const resp = await fetch(`/api/chats/${chatId}/messages`);
      if (resp.ok) {
        const msgs = await resp.json();
        setMessages(msgs);
        
        // Mark as read in backend
        if (currentUser) {
          fetch(`/api/chats/${chatId}/read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id })
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    fetchChatMessages(chat.id);
  };

  const handleRefreshChatsAndMessages = () => {
    if (!currentUser) return;
    
    // Refresh inbox directories
    fetch(`/api/chats?userId=${currentUser.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setChats);

    // Refresh current open thread
    if (activeChat) {
      fetch(`/api/chats/${activeChat.id}/messages`)
        .then(r => r.ok ? r.json() : [])
        .then(setMessages);
    }
  };

  // Status switches
  const handleSetStatus = async (listingId: string, status: "active" | "sold" | "inactive") => {
    try {
      const resp = await fetch(`/api/listings/${listingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (resp.ok) {
        fetchListings();
        if (currentUser) fetchUserData(currentUser);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAndOpenForm = (listing: Listing) => {
    setEditListing(listing);
    setActiveView("create-listing");
  };

  // Admin approval
  const handleApproveListing = async (listingId: string) => {
    try {
      const resp = await fetch(`/api/admin/listings/${listingId}/approve`, {
        method: "POST"
      });

      if (resp.ok) {
        fetchListings();
        if (currentUser) fetchUserData(currentUser);
        if (selectedListing && selectedListing.id === listingId) {
          setSelectedListing({ ...selectedListing, isApproved: true });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin deletion
  const handleDeleteListing = async (listingId: string) => {
    try {
      const resp = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE"
      });

      if (resp.ok) {
        fetchListings();
        if (currentUser) fetchUserData(currentUser);
        setSelectedListing(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Client side search matching, filter computations and sorting
  const filteredListings = listings
    .filter((l) => {
      // 1. Approved filter (or if admin, or if current user owns it, show regardless of approval.
      // This allows quick tests, displaying 'under review' badges)
      const isOwner = currentUser && l.sellerId === currentUser.id;
      const isAdmin = currentUser && currentUser.isAdmin;
      if (!l.isApproved && !isOwner && !isAdmin) {
        return false;
      }

      // 2. Freetext Search Query Matching (Brand and Model)
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const matchesBrand = l.brand.toLowerCase().includes(query);
        const matchesModel = l.model.toLowerCase().includes(query);
        const matchesDesc = l.description.toLowerCase().includes(query);
        if (!matchesBrand && !matchesModel && !matchesDesc) {
          return false;
        }
      }

      // 3. Pills brand selection
      if (selectedBrand !== "Alle") {
        if (l.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
      }

      // 4. Price min-max constraints
      if (minPrice && l.price < Number(minPrice)) return false;
      if (maxPrice && l.price > Number(maxPrice)) return false;

      // 5. Year min-max constraints
      if (minYear && l.year < Number(minYear)) return false;
      if (maxYear && l.year > Number(maxYear)) return false;

      // 6. Mileage maximum limit
      if (maxMileage && l.mileage > Number(maxMileage)) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      if (sortBy === "mileage-asc") {
        return a.mileage - b.mileage;
      }
      return 0;
    });

  // Calculate unread communications count
  const unreadChatsCount = chats.reduce((acc, chat) => {
    if (!currentUser || !chat.unreadCount) return acc;
    return acc + (chat.unreadCount[currentUser.id] || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="applet-root">
      
      {/* Premium Navbar Panel */}
      <Navbar
        currentUser={currentUser}
        onLogin={handleLoginSubmit}
        onLogout={handleLogout}
        onNavigate={handleNavigationChange}
        activeView={activeView}
        unreadCount={unreadChatsCount}
        favoriteCount={favorites.length}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Routing Render Engine */}

        {/* 1. SHOPPING VIEW / INSERATE STÖBERN */}
        {activeView === "browse" && (
          <div className="space-y-6 animate-in fade-in duration-200" id="view-browse">
            
            {/* Elegant Hero Welcome Banner */}
            <div className="bg-slate-900 text-white rounded p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-transparent"></div>
              
              <div className="relative space-y-4 max-w-xl">
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 font-mono text-[9px] font-bold tracking-widest uppercase rounded-sm">
                  Premium Automobil Börse
                </span>
                <h1 className="font-sans font-black text-3xl sm:text-4xl tracking-tight leading-tight uppercase">
                  Finden Sie Ihr Traumauto zum <span className="text-blue-500 font-extrabold normal-case">Bestpreis</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
                  Stöbern Sie durch Hunderte handverlesener Sportwagen, Familienwagen und nachhaltiger E-Schnittstellen. Transparent, sicher und direkt über den internen Chat.
                </p>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto relative">
                {!currentUser ? (
                  <button
                    onClick={() => {
                      setIsRegistering(true);
                      setActiveView("profile");
                    }}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded cursor-pointer flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    Jetzt Mitglied werden
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveView("create-listing")}
                    className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider rounded cursor-pointer flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    Eigenes Inserat inserieren
                    <PlusCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-center text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold">
                  ★ Scheckheftgeprüfte Fahrzeuge
                </span>
              </div>
            </div>

            {/* Filter controls row */}
            <div className="space-y-4 bg-white border border-slate-200 rounded p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Free keywords input field */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Freitexteingabe von Marke oder Modell (z. B. Porsche 911 Performance, Tesla)..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded text-xs bg-slate-50/50 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-2.5 text-slate-450 hover:text-slate-700 font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2.5 border rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      showFilters
                        ? "bg-slate-900 border-slate-950 text-white"
                        : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filters {showFilters ? "schließen" : "einblenden"}
                  </button>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded text-xs font-bold uppercase tracking-wider bg-white cursor-pointer focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                  >
                    <option value="newest">Neueste Inserate zuerst</option>
                    <option value="price-asc">Ergebnisse nach Preis: aufsteigend</option>
                    <option value="price-desc">Ergebnisse nach Preis: absteigend</option>
                    <option value="mileage-asc">Nach Laufleistung: aufsteigend</option>
                  </select>
                </div>
              </div>

              {/* Horizontal pills selections */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-2">Marke:</span>
                {BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                      selectedBrand === brand
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100/50"
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              {/* Advanced criteria drawers */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50/70 rounded border border-slate-200 animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preisspanne (€)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Min €"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded text-xs outline-none focus:border-blue-600"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max €"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Mileage */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Max Laufleistung (km)</label>
                    <input
                      type="number"
                      value={maxMileage}
                      onChange={(e) => setMaxMileage(e.target.value)}
                      placeholder="z. B. 100000"
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded text-xs outline-none focus:border-blue-600=0"
                    />
                  </div>

                  {/* Year range */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Baujahr Bereich</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={minYear}
                        onChange={(e) => setMinYear(e.target.value)}
                        placeholder="Von 2018"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded text-xs outline-none focus:border-blue-600"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="number"
                        value={maxYear}
                        onChange={(e) => setMaxYear(e.target.value)}
                        placeholder="Bis 2026"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Clear button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                        setMinYear("");
                        setMaxYear("");
                        setMaxMileage("");
                        setSelectedBrand("Alle");
                        setSearchQuery("");
                      }}
                      className="w-full py-1.5 border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors"
                    >
                      Filter zurücksetzen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inserate Listings grid */}
            {filteredListings.length === 0 ? (
              <div className="p-16 text-center text-slate-400 border border-slate-200 bg-white rounded flex flex-col items-center justify-center">
                <Car className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="font-sans font-bold text-sm text-slate-700 uppercase tracking-wider">Keine Fahrzeuge gefunden</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Für Ihre Suchkombination gibt es augenblicklich kein freigegebenes Fahrzeug. Probieren Sie andere Spezifikationen oder Filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFavorited={favorites.some(f => f.id === listing.id)}
                    onToggleFavorite={(e) => handleBookmarkToggle(e, listing.id)}
                    onClick={() => setSelectedListing(listing)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ADD / EDIT LISTING FORM VIEW */}
        {activeView === "create-listing" && (
          <div id="view-create-listing">
            <ListingForm
              currentUser={currentUser}
              editListing={editListing}
              onSubmit={handleListingCreateOrEdit}
              onClose={() => {
                setEditListing(null);
                setActiveView(currentUser ? "my-listings" : "browse");
              }}
            />
          </div>
        )}

        {/* 3. OWN VEHICLES VIEW / MEINE FAHRZEUGE */}
        {activeView === "my-listings" && currentUser && (
          <div id="view-my-listings">
            <ProfilePanel
              currentUser={currentUser}
              listings={listings}
              favoritesCount={favorites.length}
              onUpdateProfile={handleProfileUpdate}
              onNavigate={handleNavigationChange}
              onEditListing={handleEditAndOpenForm}
              onSetStatus={handleSetStatus}
            />
          </div>
        )}

        {/* 4. BOOKMARKS / FAVORITEN / MERKLISTE */}
        {activeView === "favorites" && currentUser && (
          <div className="space-y-8 animate-in fade-in duration-200" id="view-favorites">
            <div>
              <h1 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Meine Merkliste / Favoriten
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Gespeicherte Fahrzeuge zum schnellen Abrufen und Vergleichen.
              </p>
            </div>

            {favorites.length === 0 ? (
              <div className="p-16 text-center text-slate-400 border border-slate-100 bg-white rounded-3xl flex flex-col items-center justify-center">
                <Heart className="w-12 h-12 text-slate-200 mb-3" />
                <h3 className="font-display font-bold text-sm text-slate-700">Ihre Merkliste ist leer</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Markieren Sie interessante Autos beim Stöbern mit dem Herz-Symbol, um sie hier wiederzufinden.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFavorited={true}
                    onToggleFavorite={(e) => handleBookmarkToggle(e, listing.id)}
                    onClick={() => setSelectedListing(listing)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. MESSAGES INBOX VIEW / CHATS */}
        {activeView === "chats" && currentUser && (
          <div id="view-chats">
            <ChatInbox
              currentUser={currentUser}
              chats={chats}
              activeChat={activeChat}
              messages={messages}
              onSelectChat={handleSelectChat}
              onSendMessage={handleSendMessage}
              onRefreshChatsAndMessages={handleRefreshChatsAndMessages}
            />
          </div>
        )}

        {/* 6. PROFILE PROFILE VIEW */}
        {activeView === "profile" && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-200" id="view-profile">
            {currentUser ? (
              <ProfilePanel
                currentUser={currentUser}
                listings={listings}
                favoritesCount={favorites.length}
                onUpdateProfile={handleProfileUpdate}
                onNavigate={handleNavigationChange}
                onEditListing={handleEditAndOpenForm}
                onSetStatus={handleSetStatus}
              />
            ) : (
              <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm text-center space-y-6">
                {isRegistering ? (
                  /* Register Mode */
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl mb-2">
                        <UserIcon className="w-8 h-8" />
                      </div>
                      <h2 className="font-display font-extrabold text-xl text-slate-900">Als Mitglied registrieren</h2>
                      <p className="text-xs text-slate-400 mt-1">Melden Sie sich an, um eigene Autos anzubieten und mit Händlern zu chatten.</p>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ihr vollständiger Name *</label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="z. B. Max Mustermann"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">E-Mail-Adresse *</label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="muster@beispiel.de"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Telefonnummer</label>
                        <input
                          type="text"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+49 170 1234567"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Passwort *</label>
                        <input
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mindestens 6 Zeichen"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>

                      {regError && (
                        <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl">
                          {regError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Kostenloses Profil erstellen
                      </button>
                    </form>

                    <div className="pt-2">
                      <p className="text-xs text-slate-400">
                        Haben Sie bereits ein Profil?{" "}
                        <button
                          onClick={() => setIsRegistering(false)}
                          className="text-sky-600 font-bold hover:underline cursor-pointer"
                        >
                          Hier Einloggen
                        </button>
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Login Mode */
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl mb-2">
                        <LogIn className="w-8 h-8" />
                      </div>
                      <h2 className="font-display font-extrabold text-xl text-slate-900">Anmelden im Autohaus</h2>
                      <p className="text-xs text-slate-400 mt-1">Geben Sie Ihre Mail ein oder nutzen Sie instantan ein Demo-Profil aus der Top-Leiste.</p>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2 text-left">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider text-center">In 1-Klick mit Demo-Accounts testen:</p>
                      <div className="grid grid-cols-1 ssm:grid-cols-2 gap-2">
                        <button
                          onClick={() => handleLoginSubmit("kaeufer@autohaus.de", "kaeufer123")}
                          className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl hover:border-sky-500 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          🚗 Käufer Login
                        </button>
                        <button
                          onClick={() => handleLoginSubmit("max.mustermann@autohaus.de", "max123")}
                          className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl hover:border-sky-500 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          💼 Verkäufer Login
                        </button>
                        <button
                          onClick={() => handleLoginSubmit("admin@autohaus.de", "admin123")}
                          className="col-span-1 ssm:col-span-2 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          🛡️ Administrator Login
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400">
                        Noch kein Profil?{" "}
                        <button
                          onClick={() => setIsRegistering(true)}
                          className="text-sky-600 font-bold hover:underline cursor-pointer"
                        >
                          Hier kostenlos registrieren
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 7. ADMIN MANAGEMENT VIEW / ADMIN */}
        {activeView === "admin" && currentUser?.isAdmin && (
          <div id="view-admin">
            <AdminPanel
              stats={adminStats}
              users={adminUsers}
              pendingListings={listings.filter((l) => !l.isApproved)}
              onApproveListing={handleApproveListing}
              onDeleteListing={handleDeleteListing}
              onViewListing={(listing) => {
                setSelectedListing(listing);
              }}
            />
          </div>
        )}

      </main>

      {/* DETAILED MODAL OVERLAY (VEHICULAR FULL DETAILS) */}
      {selectedListing && (
        <ListingDetail
          listing={selectedListing}
          currentUser={currentUser}
          isFavorited={favorites.some(f => f.id === selectedListing.id)}
          onToggleFavorite={(id) => handleBookmarkToggle(null, id)}
          onClose={() => setSelectedListing(null)}
          onSendMessage={handleSendMessage}
          onApprove={currentUser?.isAdmin ? handleApproveListing : undefined}
          onDeleteListing={currentUser?.isAdmin ? handleDeleteListing : undefined}
        />
      )}
    </div>
  );
}
