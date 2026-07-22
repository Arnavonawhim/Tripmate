"use client"

import { useState } from "react"
import { askScene, type SceneResult } from "@/lib/api"

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
    <section className="panel fade-up">
      <label
        className={`dropzone ${dragging ? "dragging" : ""}`}
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
          <img className="preview" src={preview} alt="scene preview" />
        ) : (
          <div className="dropzone-inner">
            <div className="dropzone-icon">+</div>
            <p>
              <strong>Drop a photograph</strong>, click to browse, or open the
              camera on mobile
            </p>
            <p className="muted">landmarks · menus · signs · street scenes</p>
          </div>
        )}
      </label>

      <input
        className="question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Translate this menu… what landmark is this…"
      />

      <div className="row">
        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <span className="spinner" /> reading the scene
            </>
          ) : (
            <>
              Analyze scene <span className="btn-arrow">→</span>
            </>
          )}
        </button>
        {file && <span className="muted">{file.name}</span>}
      </div>

      {error && (
        <div className="card fade-up">
          <p className="error-text">{error}</p>
        </div>
      )}

      {result && (
        <div className="card winner fade-up">
          <p className="micro-label">scene report — vision worker</p>
          <div className="winner-head">
            <h3>{result.provider ?? "vision"}</h3>
            <div className="meta">
              {result.latency_ms != null && (
                <span className="badge">{result.latency_ms} ms</span>
              )}
              {result.cached && (
                <span className="badge badge-cached">cached</span>
              )}
            </div>
          </div>
          <p className="answer">{result.answer}</p>
        </div>
      )}
    </section>
  )
}
