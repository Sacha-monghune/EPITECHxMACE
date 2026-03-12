export interface PictureProps {
  longitude: number
  latitude: number
  path: string
  commentary: string | null
  timestamp: Date
}

interface PictureApiResponse {
  longitude: number
  latitude: number
  path: string
  commentary: string | null
  timestamp: string
}

// const API_URL = import.meta.env.DATABASE_URL ?? "http://localhost:8080"
const API_URL = import.meta.env.DATABASE_URL

export async function fetchAllPictures(): Promise<PictureProps[]> {
  const response = await fetch(`${API_URL}/picture`)

  if (!response.ok) {
    throw new Error(`Failed to fetch pictures: ${response.status} ${response.statusText}`)
  }

  const pictures = (await response.json()) as PictureApiResponse[]

  return pictures.map((picture) => ({
    ...picture,
    timestamp: new Date(picture.timestamp),
  }))
}
