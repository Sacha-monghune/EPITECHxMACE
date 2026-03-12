import "leaflet/dist/leaflet.css"
import { useState } from "react"
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet"

const Map = () => {
  const position: [number, number] = [-21.115, 55.532]
  const [language, setLanguage] = useState<"fr" | "en">("fr")
  const isFrench = language === "fr"

  return (
    <div className="relative h-full w-full overflow-hidden rounded-4xl border border-white/80 bg-[#f8f4ea] shadow-[0_28px_90px_rgba(148,163,184,0.26)]">
      <MapContainer
        center={position}
        zoom={11}
        scrollWheelZoom={false}
        zoomControl={false}
        className="atlas-map h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-450 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(248,244,234,0.2))]" />
      <div className="absolute inset-x-6 top-6 z-500 flex items-start justify-between gap-4">
        <div className="max-w-sm rounded-[1.75rem] border border-white/85 bg-white/86 px-6 py-5 text-slate-900 shadow-[0_18px_45px_rgba(148,163,184,0.22)] backdrop-blur-md">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-blue-700">
            {isFrench ? "Carte en direct" : "Live map"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {isFrench ? "L'île de la Reunion" : "Reunion Island"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setLanguage(isFrench ? "en" : "fr")}
          className="cursor-pointer rounded-full border border-white/85 bg-white/88 px-5 py-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-800 shadow-[0_12px_30px_rgba(148,163,184,0.22)] backdrop-blur-md transition hover:bg-blue-500 hover:text-white"
        >
          {isFrench ? "Français" : "English"}
        </button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#f3ede1]/78 to-transparent" />
    </div>
  )
}

export default Map
