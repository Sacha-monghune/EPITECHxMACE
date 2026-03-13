import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useMemo, useState } from "react"
import type { Map as LeafletMap } from "leaflet"
import { MapContainer, Marker, Pane, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet"
import type { Language } from "../App"
import type { Location, LocationCategory } from "../types"

interface MapProps {
  language: Language
  locations: Location[]
  activeLocationIds: number[]
  selectedLocationId: number | null
  onSelectLocation: (locationId: number) => void
  onToggleLanguage: () => void
  isLoading: boolean
  error: string | null
  liveProgress: number
}

const copy = {
  en: {
    food: "Food",
    nature: "Nature",
    shopping: "Shopping",
    places: "places",
    livePops: "live pops",
    loading: "Loading locations and map feed...",
    switchLanguage: "🇬🇧 English",
    recenter: "Recenter",
  },
  fr: {
    food: "Restauration",
    nature: "Nature",
    shopping: "Shopping",
    places: "lieux",
    livePops: "popups live",
    loading: "Chargement des lieux et du flux de la carte...",
    switchLanguage: "🇫🇷 Français",
    recenter: "Recentrer",
  },
} as const

const reunionCenter: [number, number] = [-21.115, 55.532]
const POP_CARD_HEIGHT = 182
const POP_SAFE_TOP = 210

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getCategoryLabel(category: LocationCategory, language: Language) {
  if (category === "food") {
    return copy[language].food
  }

  if (category === "nature") {
    return copy[language].nature
  }

  return copy[language].shopping
}

function createMarkerIcon(category: LocationCategory, isSelected: boolean) {
  const color = category === "food" ? "#f97316" : category === "nature" ? "#10b981" : "#2563eb"
  const glow =
    category === "food"
      ? "rgba(249,115,22,0.24)"
      : category === "nature"
        ? "rgba(16,185,129,0.24)"
        : "rgba(37,99,235,0.24)"

  return L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:999px;background:${color};border:3px solid rgba(255,255,255,0.96);box-shadow:0 18px 35px ${glow},0 0 0 ${isSelected ? "8px rgba(15,23,42,0.14)" : "0px transparent"};transition:transform 180ms ease;">
        <div style="width:8px;height:8px;border-radius:999px;background:white;"></div>
      </div>
    `,
  })
}

function createPhotoPopIcon(location: Location, progress: number, placeBelow: boolean, language: Language) {
  const color = location.category === "food" ? "#f97316" : location.category === "nature" ? "#10b981" : "#2563eb"
  const imageUrl = location.main_picture?.path ?? ""
  const title = escapeHtml(location.name)
  const categoryLabel = escapeHtml(getCategoryLabel(location.category, language))
  const progressWidth = Math.max(0, Math.min(progress, 1)) * 100
  const lineStyles = placeBelow
    ? `top:0;height:52px;background:linear-gradient(180deg, rgba(15,23,42,0.06), ${color});`
    : `bottom:0;height:52px;background:linear-gradient(180deg, ${color}, rgba(15,23,42,0.06));`
  const cardStyles = placeBelow ? "top:52px;" : "bottom:52px;"

  return L.divIcon({
    className: "",
    iconSize: [190, POP_CARD_HEIGHT],
    iconAnchor: placeBelow ? [95, 0] : [95, POP_CARD_HEIGHT - 2],
    html: `
      <div style="position:relative;width:190px;height:${POP_CARD_HEIGHT}px;pointer-events:none;overflow:visible;">
        <div style="position:absolute;left:50%;transform:translateX(-50%);width:2px;${lineStyles}"></div>
        <div style="position:absolute;left:50%;transform:translateX(-50%);${cardStyles}width:172px;border-radius:22px;overflow:hidden;background:rgba(255,255,255,0.96);border:1px solid rgba(255,255,255,0.95);box-shadow:0 24px 60px rgba(15,23,42,0.18);">
          <div style="height:110px;background-image:url('${imageUrl}');background-size:cover;background-position:center;"></div>
          <div style="padding:10px 12px 12px 12px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${color};">${categoryLabel}</div>
            <div style="margin-top:6px;font-size:14px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
            <div style="margin-top:10px;height:6px;border-radius:999px;background:rgba(148,163,184,0.22);overflow:hidden;">
              <div style="height:100%;width:${progressWidth}%;border-radius:999px;background:${color};transition:width 100ms linear;"></div>
            </div>
          </div>
        </div>
      </div>
    `,
  })
}

function LivePopMarker({ location, progress, language }: { location: Location; progress: number; language: Language }) {
  const [placeBelow, setPlaceBelow] = useState(false)

  const map = useMapEvents({
    move: updatePlacement,
    zoom: updatePlacement,
    resize: updatePlacement,
  })

  function updatePlacement() {
    const point = map.latLngToContainerPoint([location.latitude, location.longitude])
    setPlaceBelow(point.y < POP_SAFE_TOP)
  }

  useEffect(() => {
    updatePlacement()
  }, [location.id, map])

  const icon = useMemo(
    () => createPhotoPopIcon(location, progress, placeBelow, language),
    [location, progress, placeBelow, language]
  )

  return <Marker position={[location.latitude, location.longitude]} icon={icon} interactive={false} />
}

function MapBridge({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap()

  useEffect(() => {
    onReady(map)
  }, [map, onReady])

  return null
}

function Map({
  language,
  locations,
  activeLocationIds,
  selectedLocationId,
  onSelectLocation,
  onToggleLanguage,
  isLoading,
  error,
  liveProgress,
}: MapProps) {
  const text = copy[language]
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/80 bg-[#f8f4ea] shadow-[0_28px_90px_rgba(148,163,184,0.26)]">
      <MapContainer
        center={reunionCenter}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        className="map-shell h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapBridge onReady={setMapInstance} />
        <ZoomControl position="bottomright" />

        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createMarkerIcon(location.category, selectedLocationId === location.id)}
            zIndexOffset={1000}
            eventHandlers={{
              click: () => onSelectLocation(location.id),
            }}
          />
        ))}

        <Pane name="live-pop-pane" style={{ zIndex: 450, pointerEvents: "none" }}>
          {locations
            .filter((location) => activeLocationIds.includes(location.id) && location.main_picture)
            .map((location) => (
              <LivePopMarker key={`active-${location.id}`} location={location} progress={liveProgress} language={language} />
            ))}
        </Pane>
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.52),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
      <button
        type="button"
        onClick={onToggleLanguage}
        className="absolute left-6 top-6 z-[500] cursor-pointer rounded-full border border-white/85 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur-md transition hover:border-blue-500 hover:text-blue-700"
      >
        {text.switchLanguage}
      </button>

      <button
        type="button"
        onClick={() => mapInstance?.setView(reunionCenter, 11, { animate: true })}
        className="absolute bottom-6 left-6 z-[500] cursor-pointer rounded-full border border-white/85 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur-md transition hover:border-blue-500 hover:text-blue-700"
      >
        {text.recenter}
      </button>

      <div className="absolute right-6 top-6 z-[500] flex gap-3">
        <div className="rounded-full border border-white/85 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur-md">
          {locations.length} {text.places}
        </div>
        <div className="rounded-full border border-white/85 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur-md">
          {activeLocationIds.length} {text.livePops}
        </div>
      </div>

      {isLoading ? (
        <div className="absolute inset-x-6 bottom-6 z-[500] rounded-2xl border border-white/80 bg-white/88 px-5 py-4 text-sm text-slate-600 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur-md">
          {text.loading}
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-x-6 bottom-6 z-[500] rounded-2xl border border-red-200 bg-red-50/94 px-5 py-4 text-sm text-red-700 shadow-[0_12px_30px_rgba(248,113,113,0.12)] backdrop-blur-md">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default Map
