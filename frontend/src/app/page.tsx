"use client"
import { useState } from "react"

export default function Home() {
  const [url, setUrl] = useState("")
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState("")
  const [loadingIngest, setLoadingIngest] = useState(false)
  const [loadingQuery, setLoadingQuery] = useState(false)
  const [ingestStatus, setIngestStatus] = useState("")

  async function submitQuery(query : string) {
    console.log("Query recieved : " , {query} )
    if (!query.trim()) return
    setLoadingQuery(true)
    const res = await fetch("https://doc-assistant-ld52.onrender.com/query",{
      method : "POST",
      headers : {'Content-Type' : "application/json"},
      body : JSON.stringify({query:query})
    } )
    const data = await res.json()
    setAnswer(data)
    setLoadingQuery(false)
    return console.log(data)
  }

  async function submitUrl(url : string) {
    if (!url.trim()) return
    console.log("Url Recieved")
    setLoadingIngest(true)
    const res =  await fetch("https://doc-assistant-ld52.onrender.com/ingest",{
      method : "POST",
      headers : {'Content-Type' : "application/json"},
      body : JSON.stringify({url:url})
    })
    const data = await res.json()
    setIngestStatus(data.status === "success" ? "✓ Docs loaded" : `⚠ Something went wrong`)
    setLoadingIngest(false)
    return console.log(data)
  }

    return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#0A0F1C",
      color: "#F1F5F9",
      fontFamily: "'Inter', sans-serif",
      padding: "2.5rem 1.5rem",
    }}>
 
      {/* Header */}
      <div style={{ maxWidth: "860px", margin: "0 auto 2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
          <div style={{
            width: "8px", height: "32px",
            backgroundColor: "#6366F1",
            borderRadius: "2px",
          }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Docs Assistant
          </h1>
        </div>
        <p style={{ color: "#94A3B8", fontSize: "0.875rem", margin: 0, paddingLeft: "1.25rem" }}>
          Load any documentation URL, then ask questions in plain English.
        </p>
      </div>
 
      <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
 
        {/* Load Docs Panel */}
        <div style={{
          backgroundColor: "#111827",
          border: "1px solid #1E293B",
          borderRadius: "10px",
          padding: "1.5rem",
        }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6366F1", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>
            Load Documentation
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitUrl(url)}
              placeholder="https://fastapi.tiangolo.com/tutorial/first-steps/"
              style={{
                flex: 1,
                backgroundColor: "#0A0F1C",
                border: "1px solid #1E293B",
                borderRadius: "6px",
                padding: "0.6rem 0.875rem",
                color: "#F1F5F9",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
            <button
              onClick={() => submitUrl(url)}
              disabled={loadingIngest}
              style={{
                backgroundColor: loadingIngest ? "#374151" : "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "0.6rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: loadingIngest ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.15s",
              }}
            >
              {loadingIngest ? "Loading..." : "Load Docs"}
            </button>
          </div>
          {ingestStatus && (
            <p style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: ingestStatus.startsWith("✓") ? "#34D399" : "#F87171",
            }}>
              {ingestStatus}
            </p>
          )}
        </div>
 
        {/* Query Panel */}
        <div style={{
          backgroundColor: "#111827",
          border: "1px solid #1E293B",
          borderRadius: "10px",
          padding: "1.5rem",
        }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6366F1", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>
            Ask a Question
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitQuery(query)}
              placeholder="How do I create a FastAPI route?"
              style={{
                flex: 1,
                backgroundColor: "#0A0F1C",
                border: "1px solid #1E293B",
                borderRadius: "6px",
                padding: "0.6rem 0.875rem",
                color: "#F1F5F9",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
            <button
              onClick={() => submitQuery(query)}
              disabled={loadingQuery}
              style={{
                backgroundColor: loadingQuery ? "#374151" : "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "0.6rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: loadingQuery ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.15s",
              }}
            >
              {loadingQuery ? "Thinking..." : "Ask"}
            </button>
          </div>
        </div>
 
        {/* Answer Terminal */}
        {(answer || loadingQuery) && (
          <div style={{
            backgroundColor: "#111827",
            border: "1px solid #1E293B",
            borderLeft: "3px solid #6366F1",
            borderRadius: "10px",
            padding: "1.5rem",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6366F1", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.875rem" }}>
              Answer
            </p>
            {loadingQuery ? (
              <p style={{ color: "#94A3B8", fontSize: "0.875rem", fontStyle: "italic" }}>Searching docs...</p>
            ) : (
              <p style={{
                fontFamily: "'Arial",
                fontSize: "0.85rem",
                lineHeight: "1.75",
                color: "#CBD5E1",
                margin: 0,
                whiteSpace: "pre-wrap",
              }}>
                {answer}
              </p>
            )}
          </div>
        )}
 
      </div>
    </main>
  )
  



}