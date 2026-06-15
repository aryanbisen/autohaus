import React, { useState, useEffect } from "react";
import { X, Upload, Info, Image, Sparkles, AlertCircle } from "lucide-react";
import { Listing, User } from "../types";

interface ListingFormProps {
  currentUser: User | null;
  editListing?: Listing | null;
  onSubmit: (data: Omit<Listing, "id" | "sellerId" | "sellerName" | "sellerPhone" | "isApproved" | "status" | "createdAt">) => Promise<boolean>;
  onClose: () => void;
}

const STOCK_CAR_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800", label: "Porsche 911" },
  { url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800", label: "BMW 3er" },
  { url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800", label: "VW Golf" },
  { url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800", label: "Tesla Model 3" },
  { url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800", label: "SUV Schwarz" },
  { url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800", label: "Mercedes AMG" }
];

export default function ListingForm({
  currentUser,
  editListing = null,
  onSubmit,
  onClose
}: ListingFormProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(2020);
  const [mileage, setMileage] = useState<number>(50000);
  const [price, setPrice] = useState<number>(20000);
  const [fuelType, setFuelType] = useState<Listing["fuelType"]>("Benzin");
  const [transmission, setTransmission] = useState<Listing["transmission"]>("Automatik");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("München");
  const [images, setImages] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  // Populate form if we are editing an existing listing
  useEffect(() => {
    if (editListing) {
      setBrand(editListing.brand);
      setModel(editListing.model);
      setYear(editListing.year);
      setMileage(editListing.mileage);
      setPrice(editListing.price);
      setFuelType(editListing.fuelType);
      setTransmission(editListing.transmission);
      setDescription(editListing.description);
      setLocation(editListing.sellerLocation);
      setImages(editListing.images);
    }
  }, [editListing]);

  // Handle Drag Events for local photos upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Convert uploaded image file to fully functional base64 URL
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFiles(e.target.files);
    }
  };

  const handleImageFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Bitte laden Sie nur Bilddateien hoch.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customImageUrl.trim()) {
      setImages((prev) => [...prev, customImageUrl.trim()]);
      setCustomImageUrl("");
    }
  };

  const selectStockPhoto = (url: string) => {
    if (!images.includes(url)) {
      setImages((prev) => [...prev, url]);
    }
  };

  const removePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!brand || !model || !description || !location) {
      setErrorMsg("Bitte füllen Sie alle erforderlichen Felder aus.");
      return;
    }

    if (images.length === 0) {
      setErrorMsg("Bitte fügen Sie mindestens ein Foto Ihres Fahrzeugs hinzu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        brand,
        model,
        year,
        mileage,
        price,
        fuelType,
        transmission,
        description,
        images,
        sellerLocation: location
      });

      if (success) {
        onClose();
      } else {
        setErrorMsg("Inserat konnte nicht erstellt werden. Bitte versuchen Sie es erneut.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Es ist ein unerwarteter Fehler aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded border border-slate-200 p-6 sm:p-8 max-w-4xl mx-auto shadow-sm animate-in fade-in duration-200">
      
      {/* Title block */}
      <div className="flex justify-between items-center pb-5 border-b border-slate-200 mb-6">
        <div>
          <h2 className="font-sans font-bold text-lg text-slate-800 uppercase tracking-tight">
            {editListing ? "Fahrzeuginserat bearbeiten" : "Neues Fahrzeug anbieten"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Geben Sie alle Spezifikationen gewissenhaft ein, um die Reichweite Ihres Inserates zu maximieren.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmitForm} className="space-y-6">
        
        {/* Core fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Brand & Model */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Marke *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="z. B. Porsche, BMW, VW..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Modell *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="z. B. 911 Carrera, Golf VII..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Baujahr *
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={1900}
                  max={2027}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Kilometerstand (km) *
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing, Transmission, Fuel */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Verkaufspreis (€) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 border border-blue-200 bg-blue-50/15 focus:bg-white rounded text-xs font-mono font-bold text-blue-600 focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Kraftstoff *
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as Listing["fuelType"])}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs bg-white cursor-pointer focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                >
                  <option value="Benzin">Benzin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Elektro">Elektro</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Getriebe *
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as Listing["transmission"])}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs bg-white cursor-pointer focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                >
                  <option value="Automatik">Automatik</option>
                  <option value="Manuell">Manuell</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Fahrzeug-Standort (Stadt) *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z. B. Hamburg, Berlin, Frankfurt..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Detailed vehicle description */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Ausführliche Beschreibung *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreiben Sie Zustand, Ausstattung, Historie, Mängel oder vorgenommene Reparaturen..."
            rows={5}
            className="w-full px-3 py-2 border border-slate-200 rounded text-xs leading-relaxed focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
            required
          ></textarea>
        </div>

        {/* Interactive Photo Upload container */}
        <div className="border border-slate-200 p-5 rounded bg-slate-50/50 space-y-4">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-blue-600" />
              Bilder-Upload (Mindestens ein Foto)
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Ziehen Sie Fotos in den Bereich, wählen Sie Dateien aus oder nutzen Sie unsere voreingestellten Premium-Platzhalter.
            </p>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleFileDrop}
            className={`h-36 rounded border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer text-center relative ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-blue-500 hover:bg-white"
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-7 h-7 text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-700">Drop files here or click to upload</p>
            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, BMP bis zu 5MB</p>
          </div>

          {/* Quick stock photos picker */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Vorgefertigte Autofotos verwenden:
            </span>
            <div className="flex flex-wrap gap-2">
              {STOCK_CAR_PHOTOS.map((photo) => (
                <button
                  key={photo.url}
                  type="button"
                  onClick={() => selectStockPhoto(photo.url)}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 rounded hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <img src={photo.url} alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-sm object-cover" />
                  <span>{photo.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add custom image URL */}
          <div className="flex gap-2">
            <input
              type="url"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="Eigene Bild-URL hinzufügen (z. B. https://...)"
              className="flex-1 px-3 py-2 border border-slate-200 rounded text-xs bg-white focus:ring-1 focus:ring-blue-600/35 focus:border-blue-600 outline-none"
            />
            <button
              type="button"
              onClick={addCustomUrl}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors"
            >
              Hinzufügen
            </button>
          </div>

          {/* Preview list */}
          {images.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Aktuelle Auswahlliste (Bilder: {images.length}) • Erstes Bild ist Titelbild
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded overflow-hidden border border-slate-200 group bg-white">
                    <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-[8px] font-bold text-white text-center py-0.5 uppercase tracking-wide">
                        Titelbild
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors info prompt */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-rose-705 bg-rose-50 border border-rose-150 p-4 rounded">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-rose-600" />
            <p className="text-xs font-semibold leading-relaxed text-rose-700">{errorMsg}</p>
          </div>
        )}

        {/* Demo Alert for regular users regarding moderation */}
        {!currentUser?.isAdmin && (
          <div className="flex gap-2.5 p-4 rounded bg-amber-50 border border-amber-100 text-amber-800">
            <Info className="w-4.5 h-4.5 flex-shrink-0 text-amber-700 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              <strong>Hinweis zur Moderation:</strong> Da Sie als regulärer Nutzer eingeloggt sind, wird Ihr neues Fahrzeug aus Sicherheitsgründen zuerst im Status <strong>„Wartet auf Freigabe“</strong> angelegt. Sie können das Inserat sofort freischalten, indem Sie über das Top-Menü kurz in das Profil <strong>„Administrator“</strong> wechseln!
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-colors"
          >
            Abbrechen
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isSubmitting ? "Wird verarbeitet..." : editListing ? "Änderungen speichern" : "Inserat jetzt schalten"}
          </button>
        </div>
      </form>
    </div>
  );
}
