import React from "react";
import { Heart, Calendar, Compass, User as UserIcon, Settings } from "lucide-react";
import { Listing } from "../types";

interface ListingCardProps {
  listing: Listing;
  isFavorited: boolean;
  onToggleFavorite: any;
  onClick: any;
  canManage?: boolean;
  onSetStatus?: any;
}

export default function ListingCard({
  listing,
  isFavorited,
  onToggleFavorite,
  onClick,
  canManage = false,
  onSetStatus
}: any) {
  const isPending = !listing.isApproved;

  // Format mileage for easy reading (e.g., 78.000 km)
  const formatMileage = (km: number) => {
    return new Intl.NumberFormat("de-DE").format(km) + " km";
  };

  // Format price (e.g., 119.500 €)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div
      onClick={onClick}
      id={`car-card-${listing.id}`}
      className="group bg-white rounded border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden h-full cursor-pointer"
    >
      {/* Listing Cover Photo & Badges */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
        <img
          src={listing.images[0]}
          alt={`${listing.brand} ${listing.model}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />

        {/* Favorite Bookmark Icon */}
        <button
          onClick={(e) => onToggleFavorite(e)}
          className={`absolute top-3 right-3 w-8 h-8 rounded border flex items-center justify-center transition-all cursor-pointer z-10 ${
            isFavorited
              ? "bg-rose-600 border-rose-700 text-white hover:bg-rose-700"
              : "bg-white/95 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-white"
          }`}
          title={isFavorited ? "Von Merkliste entfernen" : "Auf Merkliste setzen"}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-white" : ""}`} />
        </button>

        {/* Dynamic Status Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {isPending && (
            <span className="bg-amber-500 text-white font-mono font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-sm">
              Moderation nötig
            </span>
          )}
          {listing.status === "sold" && (
            <span className="bg-rose-600 text-white font-mono font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-sm">
              Verkauft
            </span>
          )}
          {listing.status === "inactive" && (
            <span className="bg-slate-500 text-white font-mono font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-sm">
              Inaktiv
            </span>
          )}
        </div>
      </div>

      {/* Details Box */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Specifications info */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h4 className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {listing.brand}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold font-mono">
              {listing.year}
            </span>
          </div>

          <h3 className="font-sans font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-3 leading-tight uppercase tracking-tight">
            {listing.model}
          </h3>

          {/* Core Spec Pill grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-4 bg-slate-50 p-2 border border-slate-100/50 rounded">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{listing.year}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 truncate" title={formatMileage(listing.mileage)}>
              <Compass className="w-3 h-3 text-slate-400" />
              <span className="truncate">{formatMileage(listing.mileage)}</span>
            </div>
            <div className="text-[9px] font-mono font-bold uppercase text-slate-500 bg-white border border-slate-100 text-center py-0.5 px-1.5 rounded-sm truncate">
              {listing.fuelType}
            </div>
            <div className="text-[9px] font-mono font-bold uppercase text-slate-500 bg-white border border-slate-100 text-center py-0.5 px-1.5 rounded-sm truncate">
              {listing.transmission}
            </div>
          </div>
        </div>

        {/* Footer meta info */}
        <div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Preis
              </span>
              <p className="font-sans font-black text-sm text-blue-600 tracking-tight font-mono">
                {formatPrice(listing.price)}
              </p>
            </div>

            <div className="text-right">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Verkäufer
              </span>
              <p className="text-xs font-bold text-slate-700 max-w-[120px] truncate leading-none mt-1">
                {listing.sellerName}
              </p>
              <span className="inline-block text-[10px] text-slate-400 font-mono">
                {listing.sellerLocation}
              </span>
            </div>
          </div>

          {/* Inline controls if owned */}
          {canManage && onSetStatus && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => onSetStatus(e, "active")}
                className={`flex-1 py-1 px-2 text-[9px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  listing.status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-150"
                }`}
              >
                Aktiv
              </button>
              <button
                onClick={(e) => onSetStatus(e, "sold")}
                className={`flex-1 py-1 px-2 text-[9px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  listing.status === "sold"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-150"
                }`}
              >
                Verkauft
              </button>
              <button
                onClick={(e) => onSetStatus(e, "inactive")}
                className={`flex-1 py-1 px-2 text-[9px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  listing.status === "inactive"
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-150"
                }`}
              >
                Inaktiv
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
