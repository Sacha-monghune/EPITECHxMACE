export type LocationCategory = "food" | "nature" | "shopping"

export interface MainPicture {
  id: number
  location_id: number
  path: string
  commentary: string | null
  timestamp: string
}

export interface Location {
  id: number
  name: string
  description_fr: string | null
  description_en: string | null
  category: LocationCategory
  latitude: number
  longitude: number
  main_picture_id: number | null
  main_picture: MainPicture | null
}

export interface PictureLocation {
  id: number
  name: string
  description_fr: string | null
  description_en: string | null
  category: LocationCategory
  latitude: number
  longitude: number
  main_picture_id: number | null
}

export interface Picture {
  id: number
  location_id: number
  path: string
  commentary: string | null
  timestamp: string
  location: PictureLocation
}
