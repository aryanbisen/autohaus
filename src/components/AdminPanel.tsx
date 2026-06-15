import { Shield, Users, FileCheck, Landmark, CheckCircle, Trash2, Calendar, AlertTriangle, Eye, Sparkles } from "lucide-react";
import { User, Listing, AdminStats } from "../types";

interface AdminPanelProps {
  stats: AdminStats | null;
  users: User[];
  pendingListings: Listing[];
  onApproveListing: (listingId: string) => void;
  onDeleteListing: (listingId: string) => void;
  onViewListing: (listing: Listing) => void;
}

export default function AdminPanel({
  stats,
  users,
  pendingListings,
  onApproveListing,
  onDeleteListing,
  onViewListing
}: AdminPanelProps) {
  
  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "";
    }
  };

  // Generate path coordinates for a fluid, aesthetic SVG line chart representing daily registration stats
  const chartPoints = stats?.registrationsByDay || [];
  const chartHeight = 120;
  const chartWidth = 500;
  const maxVal = Math.max(...chartPoints.map((p) => p.count), 2);
  
  // Generate points for the SVG path
  const pointsString = chartPoints
    .map((p, index) => {
      const x = (index / (chartPoints.length - 1)) * chartWidth;
      const y = chartHeight - (p.count / maxVal) * (chartHeight - 30) - 15;
      return `${x},${y}`;
    })
    .join(" ");

  const closedPointsString = `${chartWidth},${chartHeight} 0,${chartHeight} ${pointsString}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* KPI Stats overview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Mitglieder Gesamt
            </span>
            <p className="font-display font-extrabold text-2xl text-slate-900 leading-none mt-1">
              {stats?.totalUsers || users.length}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">Registrierte Autokäufer</span>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Freigaben Warteschlange
            </span>
            <p className="font-display font-extrabold text-2xl text-amber-600 leading-none mt-1 animate-pulse">
              {pendingListings.length}
            </p>
            <span className="text-[10px] text-amber-600 block mt-1 font-medium">Prüfung & Moderation nötig</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Inserate im Internet
            </span>
            <p className="font-display font-extrabold text-2xl text-slate-900 leading-none mt-1">
              {stats?.activeListings || 0}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">Aktive Verkäufe live</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Erfolgsquote Verkauft
            </span>
            <p className="font-display font-extrabold text-2xl text-emerald-600 leading-none mt-1">
              {stats?.soldListings || 0}
            </p>
            <span className="text-[10px] text-emerald-600 block mt-1">Vermittelte Geschäfte</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytical chart row */}
      {chartPoints.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-500" />
              Tägliche Neuregistrierungen
            </h3>
            <p className="text-xs text-slate-400">Chronologischer Verlauf der Mitglieder-Registrierungen der letzten 5 Tage.</p>
          </div>

          <div className="relative w-full overflow-hidden pt-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
            {/* Custom SVG Responsive Area Chart */}
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-40 max-h-48 overflow-visible"
              id="admin-registrations-chart"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Help lines */}
              <line x1="0" y1="15" x2={chartWidth} y2="15" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1={chartHeight - 15} x2={chartWidth} y2={chartHeight - 15} stroke="#f1f5f9" strokeWidth="1" />

              {/* Gradient Area Fill */}
              {pointsString && (
                <polygon points={closedPointsString} fill="url(#skyGrad)" />
              )}
              
              {/* Fluid Line */}
              {pointsString && (
                <polyline 
                  points={pointsString} 
                  fill="none" 
                  stroke="#0284c7" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Interactive Anchor Nodes */}
              {chartPoints.map((p, index) => {
                const x = (index / (chartPoints.length - 1)) * chartWidth;
                const y = chartHeight - (p.count / maxVal) * (chartHeight - 30) - 15;
                return (
                  <g key={index} className="group">
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="6" 
                      fill="#0ea5e9" 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                      className="cursor-pointer hover:r-8 transition-all duration-150" 
                    />
                    <text 
                      x={x} 
                      y={y - 12} 
                      textAnchor="middle" 
                      className="font-mono text-[9px] font-bold fill-slate-800"
                    >
                      {p.count}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Labels under the chart */}
            <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-slate-400 px-2 mt-2">
              {chartPoints.map((p, index) => (
                <span key={index}>{p.day}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Moderation Queue List */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Inserat-Moderation & Freigaben
          </h3>
          <p className="text-xs text-slate-400">Entscheiden Sie über die Veröffentlichung neuer Verkäufer-Inserate.</p>
        </div>

        {pendingListings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-emerald-50/20 border border-emerald-100 rounded-2xl">
            <p className="text-xs font-semibold text-emerald-800">Warteschlange ist leer</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Alle eingestellten Fahrzeuge wurden geprüft und freigegeben.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingListings.map((listing) => (
              <div 
                key={listing.id} 
                id={`pending-card-${listing.id}`}
                className="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex gap-4">
                  <img src={listing.images[0]} alt="" className="w-20 aspect-video rounded-xl object-cover bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                      {listing.brand}
                    </span>
                    <h4 className="font-display font-bold text-xs text-slate-800 mt-1 lines-clamp-1 leading-tight">
                      {listing.model}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      Verkäufer: <strong>{listing.sellerName}</strong> • {listing.sellerLocation}
                    </p>
                    <p className="text-xs font-bold font-mono text-sky-600 mt-1">
                      Preis: {formatPrice(listing.price)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    onClick={() => onViewListing(listing)}
                    className="p-1 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Prüfen
                  </button>
                  <button
                    onClick={() => onApproveListing(listing.id)}
                    className="p-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-semibold text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Freigeben
                  </button>
                  <button
                    onClick={() => onDeleteListing(listing.id)}
                    className="p-1 px-3 bg-rose-600 hover:bg-rose-700 text-[10px] font-semibold text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Directory Management Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            Benutzer-Management & Accounts
          </h3>
          <p className="text-xs text-slate-400">Verwalten und einsehen aller registrierten Autokäufer & Händler-Mitglieder.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-1">Mitglied</th>
                <th className="pb-3">E-Mail-Adresse</th>
                <th className="pb-3">Telefon</th>
                <th className="pb-3">Registriert am</th>
                <th className="pb-3 text-right">Rolle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/40">
                  <td className="py-3 pl-1">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                      />
                      <p className="font-bold text-slate-800 text-xs lines-clamp-1">{user.name}</p>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600">{user.email}</td>
                  <td className="py-3 font-mono text-slate-500">{user.phone || "---"}</td>
                  <td className="py-3 font-mono text-slate-400">{formatDate(user.registeredAt)}</td>
                  <td className="py-3 text-right">
                    {user.isAdmin ? (
                      <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 uppercase">Administrator</span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">Nutzer</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
