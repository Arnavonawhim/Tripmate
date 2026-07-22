"use client"

import { useState } from "react"
import { askScene, type SceneResult } from "@/lib/api"

export default function ScenePanel() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [question, setQuestion] = useState("What am I looking at?")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SceneResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setResult(null)
    setError(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function submit() {
    if (!file || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      setResult(
        await askScene(file, question.trim() || "What am I looking at?"),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <p className="muted">
        Point your camera at a landmark, menu or sign - or upload a photo - and
        ask about it. Text in the image gets read and translated inline.
      </p>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
      />
      {preview && <img className="preview" src={preview} alt="scene preview" />}
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What do you want to know about this scene?"
      />
      <div className="row">
        <button
          className="primary"
          onClick={submit}
          disabled={!file || loading}
        >
          {loading ? "Analyzing scene..." : "Ask about this scene"}
        </button>
      </div>

      {error && (
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      )}

      {result && (
        <div className="card winner">
          <div className="meta">
            {result.provider && (
              <span className="badge model">{result.provider}</span>
            )}
            {result.latency_ms != null && (
              <span className="badge">{result.latency_ms} ms</span>
            )}
            {result.cached && <span className="badge cached">cached</span>}
          </div>
          {result.ok ? (
            <p className="answer">{result.answer}</p>
          ) : (
            <p className="error-text">
              {(result.errors ?? []).join("\n") || "Scene analysis failed."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
