import React, { useState, useEffect } from "react";
import { User as UserIcon, Phone, Mail, Award, Edit3, Save, CheckCircle2, Heart, Shield, PlusCircle, Car } from "lucide-react";
import { User, Listing } from "../types";

interface ProfilePanelProps {
  currentUser: User | null;
  listings: Listing[];
  favoritesCount: number;
  onUpdateProfile: (name: string, phone: string, avatarUrl?: string) => Promise<boolean>;
  onNavigate: (view: string) => void;
  onEditListing: (listing: Listing) => void;
  onSetStatus: (listingId: string, status: "active" | "sold" | "inactive") => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", // Woman
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", // Man 1
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", // Woman 2
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", // Man 2
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felicia",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Robert"
];

export default function ProfilePanel({
  currentUser,
  listings,
  favoritesCount,
  onUpdateProfile,
  onNavigate,
  onEditListing,
  onSetStatus
}: ProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const ownListings = listings.filter(l => l.sellerId === currentUser?.id);
  const activeCount = ownListings.filter(l => l.status === "active").length;
  const soldCount = ownListings.filter(l => l.status === "sold").length;

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfilePhone(currentUser.phone || "");
      setSelectedAvatar(currentUser.avatarUrl || "");
    }
  }, [currentUser]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    setSaving(true);
    setSuccessMsg("");
    try {
      const success = await onUpdateProfile(profileName, profilePhone, selectedAvatar);
      if (success) {
        setSuccessMsg("Profil erfolgreich aktualisiert!");
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Profile Info Row Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start justify-between">
        
        <div className="flex flex-col sm:flex-row gap-5 items-center w-full md:w-auto">
          {/* Main profile avatar */}
          <div className="relative group">
            <img
              src={selectedAvatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Autohaus"}
              alt=""
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-3xl border-2 border-sky-400 object-cover bg-slate-50 shadow-md shadow-sky-600/5"
            />
            {isEditing && (
              <label className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="w-4 h-4 mb-1" />
                Upload Photo
                <input type="file" onChange={handlePhotoUpload} accept="image/*" className="hidden" />
              </label>
            )}
          </div>

          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="font-display font-extrabold text-2xl text-slate-900 leading-none">
                {currentUser?.name}
              </h2>
              {currentUser?.isAdmin && (
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-medium font-mono mt-1.5 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {currentUser?.email}
            </p>

            <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1.5 justify-center sm:justify-start">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {currentUser?.phone ? currentUser.phone : <em className="text-slate-400 text-[11px]">Keine Telefonnummer hinterlegt</em>}
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Profil bearbeiten
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
            >
              Abbrechen
            </button>
          )}
        </div>
      </div>

      {/* Editing Form Overlay */}
      {isEditing && (
        <form onSubmit={handleProfileSubmit} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Profil-Details aktualisieren</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Ihr Name *</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Ihre Telefonnummer</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+49 170 1234567"
                className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-mono font-medium"
              />
            </div>
          </div>

          {/* Quick preset avatar selection */}
          <div className="space-y-2 pt-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Oder Avatar wählen</label>
            <div className="flex gap-2 flex-wrap pb-1">
              {PRESET_AVATARS.map((avat, id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedAvatar(avat)}
                  className={`w-12 h-12 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedAvatar === avat ? "border-sky-500 scale-95 shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={avat} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !profileName.trim()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Wird gespeichert..." : "Änderungen speichern"}
            </button>
          </div>
        </form>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
            Meine aktiven Inserate
          </span>
          <p className="font-display font-extrabold text-2xl text-slate-900 font-semibold">{activeCount}</p>
          <span className="text-[10px] text-slate-400 block mt-1">Eigene Autos im Verkauf</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
            Erfolgreich Verkauft
          </span>
          <p className="font-display font-extrabold text-2xl text-emerald-600 font-semibold">{soldCount}</p>
          <span className="text-[10px] text-emerald-600 block mt-1">Status als „Verkauft“</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
            Gemerkt in Merkliste
          </span>
          <p className="font-display font-extrabold text-2xl text-rose-500 font-semibold">{favoritesCount}</p>
          <span className="text-[10px] text-rose-400 block mt-1">Merke für späteren Abruf</span>
        </div>
      </div>

      {/* My listings table management list */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-sky-500" />
              Eigene Inserate verwalten
            </h3>
            <p className="text-xs text-slate-400">Übersicht aller von Ihnen angebotenen Neufahrzeuge oder Occasionen.</p>
          </div>
          <button
            onClick={() => onNavigate("create-listing")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Neues Auto inserieren
          </button>
        </div>

        {ownListings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-xs font-semibold">Sie haben noch keine Automobile inseriert</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">
              Nutzen Sie den Button oben, um Ihr Fahrzeug in wenigen Minuten zu fotografieren und online zu stellen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-1">Fahrzeug</th>
                  <th className="pb-3">Preis</th>
                  <th className="pb-3">Baujahr</th>
                  <th className="pb-3">Freigabe status</th>
                  <th className="pb-3">Marktplatz-Status</th>
                  <th className="pb-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ownListings.map((listing) => (
                  <tr key={listing.id} id={`row-manage-${listing.id}`} className="hover:bg-slate-50/50">
                    <td className="py-3 px-1">
                      <div className="flex items-center gap-3">
                        <img src={listing.images[0]} alt="" className="w-10 h-7 rounded-md object-cover bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-800 text-xs lines-clamp-1">{listing.brand} {listing.model}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{listing.sellerLocation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-display font-bold text-sky-600">{formatPrice(listing.price)}</td>
                    <td className="py-3 font-mono">{listing.year}</td>
                    <td className="py-3">
                      {listing.isApproved ? (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Freigegeben</span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded animate-pulse">In Prüfung (Prüfung nötig)</span>
                      )}
                    </td>
                    <td className="py-3">
                      <select
                        value={listing.status}
                        onChange={(e) => onSetStatus(listing.id, e.target.value as Listing["status"])}
                        className="p-1 px-2 border border-slate-200 rounded text-[11px] font-semibold bg-white cursor-pointer"
                      >
                        <option value="active">Aktiv</option>
                        <option value="sold">Als Verkauft markieren</option>
                        <option value="inactive">Inaktiv</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onEditListing(listing)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold rounded cursor-pointer"
                        >
                          Bearbeiten
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
