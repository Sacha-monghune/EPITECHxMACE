import { useEffect, useRef } from "react"
import type { Language } from "../App"
import type { Location, Picture } from "../types"

interface SidebarProps {
  language: Language
  selectedLocation: Location | null
  pictures: Picture[]
  focusPictures: Picture[]
  isLoading: boolean
  isLoadingFocusPictures: boolean
  error: string | null
  onClearSelection: () => void
}

const copy = {
  en: {
    focusMode: "Focus mode",
    explorationMode: "Exploration mode",
    streamTitle: "Visitor photo stream",
    emptyDescription: "This location has no description yet.",
    streamDescription: "A rolling feed of all uploaded pictures. Click any map marker to lock the panel on one place.",
    back: "Back",
    relatedPictures: "Related pictures",
    latestUploads: "Latest uploads",
    items: "items",
    loadingPictures: "Loading pictures...",
    noFocusPictures: "No pictures are linked to this location yet.",
    noPictures: "No pictures available yet.",
    noCommentary: "No commentary provided for this picture.",
  },
  fr: {
    focusMode: "Mode focus",
    explorationMode: "Mode exploration",
    streamTitle: "Flux photo visiteurs",
    emptyDescription: "Ce lieu n'a pas encore de description.",
    streamDescription: "Un flux continu de toutes les photos ajoutées. Clique sur un marqueur pour verrouiller le panneau sur un lieu.",
    back: "Retour",
    relatedPictures: "Photos liees",
    latestUploads: "Derniers ajouts",
    items: "elements",
    loadingPictures: "Chargement des photos...",
    noFocusPictures: "Aucune photo n'est encore liee a ce lieu.",
    noPictures: "Aucune photo disponible pour le moment.",
    noCommentary: "Aucun commentaire n'a ete fourni pour cette photo.",
  },
} as const

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function getLocationDescription(language: Language, location: Location) {
  return language === "fr" ? location.description_fr : location.description_en
}

function Sidebar({
  language,
  selectedLocation,
  pictures,
  focusPictures,
  isLoading,
  isLoadingFocusPictures,
  error,
  onClearSelection,
}: SidebarProps) {
  const text = copy[language]
  const isFocusMode = selectedLocation !== null
  const displayPictures = isFocusMode ? focusPictures : pictures
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const focusCardRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const container = scrollContainerRef.current

    if (!container || displayPictures.length <= 1) {
      return
    }

    let activeIndex = 0
    let intervalId = 0
    let isPaused = false

    const scrollToCard = (index: number) => {
      const card = focusCardRefs.current[index]

      if (!card) {
        return
      }

      container.scrollTo({
        top: card.offsetTop - container.offsetTop,
        behavior: "smooth",
      })
    }

    const onMouseEnter = () => {
      isPaused = true
    }

    const onMouseLeave = () => {
      isPaused = false
    }

    container.addEventListener("mouseenter", onMouseEnter)
    container.addEventListener("mouseleave", onMouseLeave)
    container.scrollTo({ top: 0, behavior: "auto" })

    intervalId = window.setInterval(() => {
      if (isPaused) {
        return
      }

      activeIndex = (activeIndex + 1) % displayPictures.length
      scrollToCard(activeIndex)
    }, isFocusMode ? 2800 : 2400)

    return () => {
      window.clearInterval(intervalId)
      container.removeEventListener("mouseenter", onMouseEnter)
      container.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [displayPictures, isFocusMode])

  return (
    <section className="flex h-full flex-col rounded-[2rem] border border-white/80 bg-white/72 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.16)] backdrop-blur-sm">
      <div className="rounded-[1.75rem] border border-white/80 bg-white/86 px-5 py-5 shadow-[0_16px_40px_rgba(148,163,184,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-blue-700">
              {isFocusMode ? text.focusMode : text.explorationMode}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {isFocusMode ? selectedLocation.name : text.streamTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isFocusMode ? getLocationDescription(language, selectedLocation) || text.emptyDescription : text.streamDescription}
            </p>
          </div>
          {isFocusMode ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
            >
              {text.back}
            </button>
          ) : null}
        </div>

        {isFocusMode && selectedLocation.main_picture ? (
          <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-50">
            <img
              src={selectedLocation.main_picture.path}
              alt={selectedLocation.name}
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-[0_16px_40px_rgba(148,163,184,0.12)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {isFocusMode ? text.relatedPictures : text.latestUploads}
          </p>
          <p className="text-xs font-medium text-slate-400">{displayPictures.length} {text.items}</p>
        </div>

        <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
          {isLoading || (isFocusMode && isLoadingFocusPictures) ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              {text.loadingPictures}
            </div>
          ) : null}

          {error && !isLoading ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && displayPictures.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              {isFocusMode ? text.noFocusPictures : text.noPictures}
            </div>
          ) : null}

          <div className="space-y-4">
            {displayPictures.map((picture) => (
              <article
                key={picture.id}
                ref={(element) => {
                  focusCardRefs.current = focusCardRefs.current.slice(0, displayPictures.length)
                  const pictureIndex = displayPictures.findIndex((currentPicture) => currentPicture.id === picture.id)
                  focusCardRefs.current[pictureIndex] = element
                }}
                className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_12px_24px_rgba(148,163,184,0.12)]"
              >
                <img
                  src={picture.path}
                  alt={picture.commentary || picture.location.name}
                  className="h-44 w-full object-cover"
                />
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{picture.location.name}</h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                        {picture.location.category}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(picture.timestamp)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {picture.commentary || text.noCommentary}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Sidebar
