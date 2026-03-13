import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"

interface Location {
  id: number
  name: string
  description: string | null
  category: "food" | "nature" | "shopping"
  latitude: number
  longitude: number
  main_picture_id?: number | null
}

type Language = "en" | "fr"

type SubmitStatus =
  | { type: "idle"; message: string | null }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

const translations = {
  en: {
    badge: "Photo Upload",
    title: "Add a new picture",
    description:
      "Upload field photos for a location, keep a quick description, and send everything to the backend in one form.",
    location: "Location",
    image: "Image",
    commentary: "Commentary",
    loadingLocations: "Loading locations...",
    chooseLocation: "Choose a location",
    imageHint: "Select a JPG, PNG, or any browser-supported image format.",
    commentaryPlaceholder: "Describe the place, weather, or what makes this photo useful.",
    locationValidation: "Please select a location before uploading.",
    imageValidation: "Please choose an image to upload.",
    success: "Photo uploaded successfully.",
    genericUploadError: "Upload failed.",
    submit: "Upload picture",
    submitting: "Uploading...",
    previewEmpty: "Image preview will appear here as soon as you pick a file.",
    previewAlt: "Selected preview",
    workflow: "Workflow",
    steps: [
      "Select the target location from the backend list.",
      "Attach one image file through the upload field.",
      "Add a short commentary, then submit the form.",
    ],
    switchLanguage: "🇬🇧 English",
    locationLoadFallback: "Unable to load locations.",
  },
  fr: {
    badge: "Ajout de photo",
    title: "Ajouter une nouvelle photo",
    description:
      "Importe des photos prises sur le terrain pour un lieu, ajoute une courte description et envoie le tout au backend en un seul formulaire.",
    location: "Lieu",
    image: "Image",
    commentary: "Commentaire",
    loadingLocations: "Chargement des lieux...",
    chooseLocation: "Choisir un lieu",
    imageHint: "Selectionne un JPG, PNG ou tout autre format d'image pris en charge par ton navigateur.",
    commentaryPlaceholder: "Decris le lieu, la meteo ou ce qui rend cette photo utile.",
    locationValidation: "Merci de selectionner un lieu avant l'envoi.",
    imageValidation: "Merci de choisir une image a importer.",
    success: "Photo envoyee avec succes.",
    genericUploadError: "Echec de l'envoi.",
    submit: "Envoyer la photo",
    submitting: "Envoi en cours...",
    previewEmpty: "L'aperçu de l'image apparaitra ici des que tu auras choisi un fichier.",
    previewAlt: "Aperçu selectionne",
    workflow: "Etapes",
    steps: [
      "Selectionne le lieu cible depuis la liste présentée.",
      "Ajoute un fichier image via le champ d'import.",
      "Ajoute un court commentaire, puis envoie le formulaire.",
    ],
    switchLanguage: "🇫🇷 Français",
    locationLoadFallback: "Impossible de charger les lieux.",
  },
} as const

const initialStatus: SubmitStatus = { type: "idle", message: null }

function PictureUpload() {
  const [language, setLanguage] = useState<Language>("en")
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [commentary, setCommentary] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(initialStatus)
  const [validationError, setValidationError] = useState<string | null>(null)

  const copy = translations[language]

  useEffect(() => {
    let isCancelled = false

    async function loadLocations() {
      try {
        setIsLoadingLocations(true)
        setLocationError(null)

        const response = await fetch("/locations")

        if (!response.ok) {
          throw new Error(`Failed to load locations: ${response.status} ${response.statusText}`)
        }

        const data = (await response.json()) as Location[]

        if (!isCancelled) {
          setLocations(data)
        }
      } catch (error) {
        if (!isCancelled) {
          setLocationError(error instanceof Error ? error.message : copy.locationLoadFallback)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLocations(false)
        }
      }
    }

    void loadLocations()

    return () => {
      isCancelled = true
    }
  }, [copy.locationLoadFallback])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setValidationError(null)
    setSubmitStatus(initialStatus)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedLocationId) {
      setValidationError(copy.locationValidation)
      return
    }

    if (!file) {
      setValidationError(copy.imageValidation)
      return
    }

    try {
      setIsSubmitting(true)
      setValidationError(null)
      setSubmitStatus(initialStatus)

      const formData = new FormData()
      formData.append("location_id", selectedLocationId)
      formData.append("image", file)
      formData.append("commentary", commentary)

      const response = await fetch("/picture", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      setSelectedLocationId("")
      setCommentary("")
      setFile(null)
      setSubmitStatus({
        type: "success",
        message: copy.success,
      })
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error instanceof Error ? error.message : copy.genericUploadError,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "fr" : "en"))
    setValidationError(null)
    setSubmitStatus(initialStatus)
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/86 p-8 shadow-[0_24px_70px_rgba(148,163,184,0.2)] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
                {copy.badge}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
                {copy.title}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">{copy.description}</p>
            </div>
            <button
              type="button"
              onClick={toggleLanguage}
              className="cursor-pointer shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-700"
            >
              {copy.switchLanguage}
            </button>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">{copy.location}</span>
              <select
                value={selectedLocationId}
                onChange={(event) => {
                  setSelectedLocationId(event.target.value)
                  setValidationError(null)
                  setSubmitStatus(initialStatus)
                }}
                disabled={isLoadingLocations || Boolean(locationError) || isSubmitting}
                className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {isLoadingLocations ? copy.loadingLocations : copy.chooseLocation}
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">{copy.image}</span>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-blue-500">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 disabled:cursor-not-allowed"
                />
                <p className="mt-3 text-xs text-slate-500">{copy.imageHint}</p>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">{copy.commentary}</span>
              <textarea
                value={commentary}
                onChange={(event) => {
                  setCommentary(event.target.value)
                  setSubmitStatus(initialStatus)
                }}
                rows={5}
                placeholder={copy.commentaryPlaceholder}
                disabled={isSubmitting}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <div className="space-y-3">
              {locationError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {locationError}
                </p>
              ) : null}

              {validationError ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {validationError}
                </p>
              ) : null}

              {submitStatus.message ? (
                <p
                  className={`rounded-xl px-4 py-3 text-sm ${
                    submitStatus.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : submitStatus.type === "error"
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : ""
                  }`}
                >
                  {submitStatus.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || isLoadingLocations || Boolean(locationError)}
                className="cursor-pointer w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isSubmitting ? copy.submitting : copy.submit}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-4 shadow-[0_24px_70px_rgba(148,163,184,0.18)] backdrop-blur-sm">
            {previewUrl ? (
              <img src={previewUrl} alt={copy.previewAlt} className="h-[24rem] w-full rounded-[1.5rem] object-cover" />
            ) : (
              <div className="flex h-[24rem] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-[linear-gradient(135deg,_#f8fbff,_#eef4ff)] px-8 text-center text-sm text-slate-500">
                {copy.previewEmpty}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-[0_18px_50px_rgba(148,163,184,0.16)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">
              {copy.workflow}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              {copy.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PictureUpload
