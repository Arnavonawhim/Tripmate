"use client"

import { useState } from "react"
import { ImagePlus } from "lucide-react"
import { askScene, type SceneResult } from "@/lib/api"
import {
  Chip,
  ConsoleButton,
  ErrorCard,
  MicroLabel,
  Panel,
  Spinner,
  Surface,
} from "@/components/console/console-ui"
import { cn } from "@/lib/utils"

export default function ScenePanel() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [question, setQuestion] = useState("What am I looking at?")
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<SceneResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(f: File | null) {
    if (!f || !f.type.startsWith("image/")) return
    setFile(f)
    setResult(null)
    setError(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(f))
  }

  async function submit() {
    if (!file || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      setResult(await askScene(file, question))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel>
      <label
        className={cn(
          "block cursor-pointer overflow-hidden rounded-[4px] border border-dashed transition-all duration-400 [transition-timing-function:var(--ease-out-expo)]",
          dragging
            ? "border-sand-200 bg-sand-200/10"
            : "border-sand-100/25 bg-brand-900/45 hover:border-sand-100/45"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0] ?? null)
        }}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          // Blob preview — next/image can't optimise object URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="scene preview"
            className="max-h-[26rem] w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-sand-100/20 text-sand-100/60">
              <ImagePlus className="h-5 w-5" />
            </span>
            <p className="text-[0.95rem] text-sand-100/85">
              <strong className="font-medium text-sand-200">
                Drop a photograph
              </strong>
              , click to browse, or open the camera on mobile
            </p>
            <p className="text-[0.8rem] text-sand-100/45">
              landmarks · menus · signs · street scenes
            </p>
          </div>
        )}
      </label>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Translate this menu… what landmark is this…"
        aria-label="Question about the image"
        className="w-full rounded-[4px] border border-sand-100/15 bg-brand-900/45 px-5 py-3.5 text-[0.95rem] text-sand-100 outline-none transition-colors duration-300 placeholder:text-sand-100/35 focus:border-sand-200/45"
      />

      <div className="flex flex-wrap items-center gap-4">
        <ConsoleButton onClick={submit} disabled={!file || loading}>
          {loading ? (
            <>
              <Spinner /> reading the scene
            </>
          ) : (
            <>
              Analyze scene
              <span className="transition-transform duration-400 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1">
                &rarr;
              </span>
            </>
          )}
        </ConsoleButton>
        {file && (
          <span className="truncate text-[0.8rem] text-sand-100/45">
            {file.name}
          </span>
        )}
      </div>

      {error && <ErrorCard message={error} />}

      {result && (
        <Surface tone="winner">
          <MicroLabel>scene report — vision worker</MicroLabel>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl tracking-[-0.02em] text-sand-200">
              {result.provider ?? "vision"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.latency_ms != null && <Chip>{result.latency_ms} ms</Chip>}
              {result.cached && <Chip tone="cached">cached</Chip>}
            </div>
          </div>
          <p className="mt-4 leading-relaxed whitespace-pre-wrap text-sand-100/90">
            {result.answer}
          </p>
        </Surface>
      )}
    </Panel>
  )
}
