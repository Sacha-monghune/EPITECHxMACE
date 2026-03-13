import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import Map from "./components/Map"
import Sidebar from "./components/Sidebar"
import type { Location, MainPicture, Picture } from "./types"

export type Language = "en" | "fr"

interface RawMainPicture {
  id: number | string
  location_id: number | string
  path: string
  commentary: string | null
  timestamp: string
}

interface RawLocation {
  id: number | string
  name: string
  description_fr: string | null
  description_en: string | null
  category: Location["category"]
  latitude: number | string
  longitude: number | string
  main_picture_id: number | string | null
  main_picture: RawMainPicture | null
}

interface RawPictureLocation {
  id: number | string
  name: string
  description_fr: string | null
  description_en: string | null
  category: Picture["location"]["category"]
  latitude: number | string
  longitude: number | string
  main_picture_id: number | string | null
}

interface RawPicture {
  id: number | string
  location_id: number | string
  path: string
  commentary: string | null
  timestamp: string
  location: RawPictureLocation
}

const POP_INTERVAL_MS = 6000
const LIVE_POP_COUNT = 1

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  return Number(value)
}

function normalizeMainPicture(picture: RawMainPicture | null): MainPicture | null {
  if (!picture) {
    return null
  }

  return {
    id: Number(picture.id),
    location_id: Number(picture.location_id),
    path: picture.path,
    commentary: picture.commentary,
    timestamp: picture.timestamp,
  }
}

function normalizeLocation(location: RawLocation): Location {
  return {
    id: Number(location.id),
    name: location.name,
    description_fr: location.description_fr,
    description_en: location.description_en,
    category: location.category,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    main_picture_id: toNumber(location.main_picture_id),
    main_picture: normalizeMainPicture(location.main_picture),
  }
}

function normalizePicture(picture: RawPicture): Picture {
  return {
    id: Number(picture.id),
    location_id: Number(picture.location_id),
    path: picture.path,
    commentary: picture.commentary,
    timestamp: picture.timestamp,
    location: {
      id: Number(picture.location.id),
      name: picture.location.name,
      description_fr: picture.location.description_fr,
      description_en: picture.location.description_en,
      category: picture.location.category,
      latitude: Number(picture.location.latitude),
      longitude: Number(picture.location.longitude),
      main_picture_id: toNumber(picture.location.main_picture_id),
    },
  }
}

function shuffleIds(ids: number[]) {
  const nextIds = [...ids]

  for (let index = nextIds.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentValue = nextIds[index]
    nextIds[index] = nextIds[randomIndex]
    nextIds[randomIndex] = currentValue
  }

  return nextIds
}

function buildRotationBatches(locations: Location[], popCount: number, previousBatch: number[] = []) {
  const ids = locations.map((location) => location.id)

  if (ids.length === 0) {
    return []
  }

  let shuffledIds = shuffleIds(ids)

  if (previousBatch.length > 0 && shuffledIds.length > popCount) {
    while (previousBatch.some((id) => shuffledIds.slice(0, popCount).includes(id))) {
      shuffledIds = shuffleIds(ids)
    }
  }

  const batches: number[][] = []

  for (let index = 0; index < shuffledIds.length; index += popCount) {
    batches.push(shuffledIds.slice(index, index + popCount))
  }

  return batches
}

function App() {
  const [language, setLanguage] = useState<Language>("en")
  const [locations, setLocations] = useState<Location[]>([])
  const [pictures, setPictures] = useState<Picture[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [activeLocationIds, setActiveLocationIds] = useState<number[]>([])
  const [liveProgress, setLiveProgress] = useState(0)
  const [focusPictures, setFocusPictures] = useState<Picture[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingFocusPictures, setIsLoadingFocusPictures] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rotationBatchesRef = useRef<number[][]>([])
  const rotationIndexRef = useRef(0)

  function advanceLivePops(sourceLocations: Location[]) {
    if (sourceLocations.length === 0) {
      setActiveLocationIds([])
      return
    }

    if (rotationIndexRef.current >= rotationBatchesRef.current.length) {
      rotationBatchesRef.current = buildRotationBatches(sourceLocations, LIVE_POP_COUNT, activeLocationIds)
      rotationIndexRef.current = 0
    }

    const nextIds = rotationBatchesRef.current[rotationIndexRef.current] ?? []
    rotationIndexRef.current += 1

    startTransition(() => {
      setActiveLocationIds(nextIds)
    })
  }

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        setIsLoading(true)
        setError(null)

        const [locationsResponse, picturesResponse] = await Promise.all([fetch("/locations"), fetch("/picture")])

        if (!locationsResponse.ok) {
          throw new Error(`Failed to load locations: ${locationsResponse.status} ${locationsResponse.statusText}`)
        }

        if (!picturesResponse.ok) {
          throw new Error(`Failed to load pictures: ${picturesResponse.status} ${picturesResponse.statusText}`)
        }

        const locationsData = (await locationsResponse.json()) as RawLocation[]
        const picturesData = (await picturesResponse.json()) as RawPicture[]

        if (!isCancelled) {
          const normalizedLocations = locationsData.map(normalizeLocation)
          const normalizedPictures = picturesData.map(normalizePicture)

          setLocations(normalizedLocations)
          setPictures(normalizedPictures)
          rotationBatchesRef.current = buildRotationBatches(normalizedLocations, LIVE_POP_COUNT)
          rotationIndexRef.current = 0
          setLiveProgress(0)
          advanceLivePops(normalizedLocations)
        }
      } catch (nextError) {
        if (!isCancelled) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load map data.")
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (locations.length === 0) {
      return undefined
    }

    let cycleStartedAt = Date.now()

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - cycleStartedAt

      if (elapsed >= POP_INTERVAL_MS) {
        cycleStartedAt = Date.now()
        setLiveProgress(0)
        advanceLivePops(locations)
        return
      }

      setLiveProgress(elapsed / POP_INTERVAL_MS)
    }, 100)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [locations, activeLocationIds])

  useEffect(() => {
    if (selectedLocationId === null) {
      setFocusPictures([])
      return
    }

    let isCancelled = false

    async function loadFocusPictures() {
      try {
        setIsLoadingFocusPictures(true)

        const response = await fetch(`/locations/${selectedLocationId}/pictures`)

        if (!response.ok) {
          throw new Error(`Failed to load location pictures: ${response.status} ${response.statusText}`)
        }

        const data = (await response.json()) as Array<{
          id: number | string
          location_id: number | string
          path: string
          commentary: string | null
          timestamp: string
        }>

        if (!isCancelled) {
          const selectedLocation = locations.find((location) => location.id === selectedLocationId)

          if (!selectedLocation) {
            setFocusPictures([])
            return
          }

          setFocusPictures(
            data.map((picture) => ({
              id: Number(picture.id),
              location_id: Number(picture.location_id),
              path: picture.path,
              commentary: picture.commentary,
              timestamp: picture.timestamp,
              location: {
                id: selectedLocation.id,
                name: selectedLocation.name,
                description_fr: selectedLocation.description_fr,
                description_en: selectedLocation.description_en,
                category: selectedLocation.category,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                main_picture_id: selectedLocation.main_picture_id,
              },
            }))
          )
        }
      } catch (nextError) {
        if (!isCancelled) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load location pictures.")
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFocusPictures(false)
        }
      }
    }

    void loadFocusPictures()

    return () => {
      isCancelled = true
    }
  }, [locations, selectedLocationId])

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  )

  return (
    <div className="flex h-screen w-screen bg-[radial-gradient(circle_at_top_left,_#fffaf2,_#eef2f6_42%,_#e2e8f0_100%)] p-5">
      <main className="h-full w-4/7 pr-3">
        <Map
          language={language}
          locations={locations}
          activeLocationIds={activeLocationIds}
          selectedLocationId={selectedLocationId}
          onSelectLocation={setSelectedLocationId}
          onToggleLanguage={() => setLanguage((currentLanguage) => (currentLanguage === "en" ? "fr" : "en"))}
          isLoading={isLoading}
          error={error}
          liveProgress={liveProgress}
        />
      </main>
      <aside className="h-full w-3/7">
        <Sidebar
          language={language}
          selectedLocation={selectedLocation}
          pictures={pictures}
          focusPictures={focusPictures}
          isLoading={isLoading}
          isLoadingFocusPictures={isLoadingFocusPictures}
          error={error}
          onClearSelection={() => setSelectedLocationId(null)}
        />
      </aside>
    </div>
  )
}

export default App
