import React, { useState } from "react";
import { X, Calendar, Compass, HelpCircle, Phone, MapPin, Send, MessageCircle, Heart, Check, Trash2, ArrowLeft, Settings } from "lucide-react";
import { Listing, User } from "../types";

interface ListingDetailProps {
  listing: Listing;
  currentUser: User | null;
  isFavorited: boolean;
  onToggleFavorite: (listingId: string) => void;
  onClose: () => void;
  onSendMessage: (receiverId: string, listingId: string, content: string) => Promise<boolean>;
  onApprove?: (listingId: string) => void;
  onDeleteListing?: (listingId: string) => void;
}

export default function ListingDetail({
  listing,
  currentUser,
  isFavorited,
  onToggleFavorite,
  onClose,
  onSendMessage,
  onApprove,
  onDeleteListing
}: ListingDetailProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const formatMileage = (km: number) => {
    return new Intl.NumberFormat("de-DE").format(km) + " km";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!messageText.trim()) return;

    setSendingMessage(true);
    setSuccessMsg("");
    try {
      const success = await onSendMessage(listing.sellerId, listing.id, messageText);
      if (success) {
        setSuccessMsg("Ihre Nachricht wurde erfolgreich gesendet! Sie können das Gespräch im Postfach fortsetzen.");
        setMessageText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg w-full max-w-5xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Sticky detail header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zur Übersicht
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(listing.id)}
              className={`p-2 rounded border transition-all cursor-pointer ${
                isFavorited ? "bg-rose-600 border-rose-700 text-white" : "bg-white border-slate-200 text-slate-500 hover:text-rose-500"
              }`}
              title="Auf die Merkliste"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-white" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded border bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Core details scroll grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Block - Images & Description */}
          <div className="md:col-span-7 flex flex-col gap-6">
            
            {/* Display Hero Image / Carousel */}
            <div className="relative aspect-video rounded-sm bg-slate-50 overflow-hidden border border-slate-200">
              <img
                src={listing.images[activeImageIndex]}
                alt={`${listing.brand} ${listing.model}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setShowLightbox(true)}
              />
              <div className="absolute top-3 left-3 bg-black/55 text-white font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm backdrop-blur-xs">
                Bild {activeImageIndex + 1} von {listing.images.length}
              </div>
            </div>

            {/* Thumbnail carousel */}
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-24 aspect-video rounded-sm overflow-hidden border cursor-pointer flex-shrink-0 transition-all ${
                      activeImageIndex === i ? "border-blue-600 scale-95" : "border-slate-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Technical Parameters Card */}
            <div className="bg-slate-50 p-5 rounded border border-slate-200">
              <h3 className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                Technische Daten
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded border border-slate-150">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Baujahr</span>
                  <span className="text-xs font-bold font-mono text-slate-800">{listing.year}</span>
                </div>
                <div className="bg-white p-3 rounded border border-slate-150">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Laufleistung</span>
                  <span className="text-xs font-bold font-mono text-slate-800">{formatMileage(listing.mileage)}</span>
                </div>
                <div className="bg-white p-3 rounded border border-slate-150">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kraftstoff</span>
                  <span className="text-xs font-bold font-mono text-slate-800 uppercase text-[10px]">{listing.fuelType}</span>
                </div>
                <div className="bg-white p-3 rounded border border-slate-150">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Getriebe</span>
                  <span className="text-xs font-bold font-mono text-slate-800 uppercase text-[10px]">{listing.transmission}</span>
                </div>
              </div>
            </div>

            {/* Vehicular detailed description */}
            <div>
              <h3 className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3">
                Beschreibung des Verkäufers
              </h3>
              <div className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 p-5 rounded whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>
          </div>

          {/* Right Block - Pricing, Location, Contacts, Admin Tools */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* Price & Name tag */}
            <div className="bg-slate-900 text-white p-6 rounded-lg border border-slate-800">
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400 block mb-1">
                Fahrzeugpreis
              </span>
              <h2 className="font-sans font-black text-3xl tracking-tight text-white mb-4 font-mono">
                {formatPrice(listing.price)}
              </h2>
              
              <div className="h-px bg-slate-800 my-4"></div>
              
              <h1 className="font-sans font-black text-xl leading-tight uppercase tracking-tight">
                {listing.brand} <span className="text-blue-400">{listing.model}</span>
              </h1>
              
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Standort: <strong className="text-slate-200 uppercase tracking-wide text-[10px] font-mono">{listing.sellerLocation}</strong></span>
              </div>
            </div>

            {/* Seller Info Dialog Box */}
            <div className="bg-white border border-slate-200 p-5 rounded-lg">
              <h3 className="font-sans font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4">Verkäufer</h3>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-700 font-sans font-bold rounded flex items-center justify-center text-base border border-blue-100">
                  {listing.sellerName.substring(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-xs leading-none mb-1 uppercase tracking-tight">
                    {listing.sellerName}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Inserent & Eigentümer</span>
                </div>
              </div>

              {listing.sellerPhone && (
                <div className="flex items-center gap-2 text-slate-650 text-xs py-2 px-3 bg-slate-50 border border-slate-100 rounded font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Telefon: {listing.sellerPhone}</span>
                </div>
              )}

              {/* Direct Messaging module */}
              <div className="mt-4 border-t border-slate-200 pt-4">
                {!currentUser ? (
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded text-center">
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      Möchten Sie den Verkäufer kontaktieren?
                    </p>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Bitte melden Sie sich an, um den internen Echtzeit-Chat zu nutzen.
                    </p>
                  </div>
                ) : currentUser.id === listing.sellerId ? (
                  <div className="bg-blue-50 border border-blue-105 p-4 rounded text-center">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                      Das ist Ihr eigenes Inserat.
                    </p>
                    <p className="text-[11px] text-blue-600 mt-1">
                      Nutzeranfragen für dieses Fahrzeug werden in Ihrem Chat-Postfach angezeigt.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                      Nachricht an den Verkäufer senden:
                    </h4>
                    
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Hallo ${listing.sellerName.split(" ")[0]}, ich interessiere mich für Ihren ${listing.brand}...`}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white min-h-[85px] max-h-[140px] resize-y focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                      required
                    ></textarea>

                    {successMsg && (
                      <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-100">
                        {successMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={sendingMessage || !messageText.trim()}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      {sendingMessage ? "Wird gesendet..." : "Nachricht jetzt abschicken"}
                    </button>
                    <p className="text-[9px] text-center text-slate-400">
                      Ihre Telefonnummer wird automatisch an den Verkäufer übermittelt.
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* Admin Controls Segment */}
            {currentUser?.isAdmin && (onApprove || onDeleteListing) && (
              <div className="bg-amber-50/55 border border-amber-200/65 p-5 rounded-lg">
                <h3 className="font-sans font-bold text-sm text-amber-800 flex items-center gap-1.5 mb-3">
                  <Settings className="w-4 h-4 text-amber-700" />
                  Administrator Werkzeuge
                </h3>
                <p className="text-[11px] text-amber-700 mb-4 font-medium leading-relaxed">
                  Als Administrator können Sie dieses Inserat freigeben, bearbeiten oder löschen, falls es gegen Richtlinien verstößt.
                </p>
                
                <div className="flex flex-col gap-2">
                  {!listing.isApproved && onApprove && (
                    <button
                      onClick={() => onApprove(listing.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Inserat freigeben (Approve)
                    </button>
                  )}
                  {onDeleteListing && (
                    <button
                      onClick={() => onDeleteListing(listing.id)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Inserat löschen (Regelverstoß)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen images Gallery Modal */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-between items-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="w-full flex justify-end">
            <button
              onClick={() => setShowLightbox(false)}
              className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full cursor-pointer transition-all text-xl"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={listing.images[activeImageIndex]}
              alt=""
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded select-none shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>

          <div className="w-full text-center pb-4 select-none">
            <p className="text-sm font-bold text-white/95 uppercase tracking-wide">
              {listing.brand} {listing.model}
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
              Bild {activeImageIndex + 1} von {listing.images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
