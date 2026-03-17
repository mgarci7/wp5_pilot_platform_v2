"use client"

import { useEffect, useMemo, useState } from "react"
import { getSessionMessagesForEvaluation, type SessionMessageForEvaluation } from "../../lib/admin-api"
import type { SessionSummary } from "../../lib/admin-types"

type Stance = "pro" | "anti" | "neutral" | ""

type AnnotationRow = {
  message_id: string
  sender: string
  message: string
  incivility: boolean
  hate_speech: boolean
  threats_to_dem_freedom: boolean
  impoliteness: boolean
  stance: Stance
  human_like: boolean
  other: string
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default function EvaluateTab({
  adminKey,
  experimentId,
  sessions,
}: {
  adminKey: string
  experimentId: string
  sessions: SessionSummary[]
}) {
  const endedSessions = useMemo(
    () => sessions.filter((s) => s.status === "ended" || s.status === "crashed"),
    [sessions],
  )
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [rows, setRows] = useState<AnnotationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!selectedSessionId && endedSessions.length > 0) {
      setSelectedSessionId(endedSessions[0].session_id)
    }
  }, [endedSessions, selectedSessionId])

  useEffect(() => {
    if (!selectedSessionId) {
      setRows([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError("")

    getSessionMessagesForEvaluation(adminKey, selectedSessionId, experimentId)
      .then((res: { messages: SessionMessageForEvaluation[] }) => {
        if (cancelled) return
        setRows(
          res.messages.map((message) => ({
            message_id: message.message_id,
            sender: message.sender,
            message: message.content,
            incivility: false,
            hate_speech: false,
            threats_to_dem_freedom: false,
            impoliteness: false,
            stance: "",
            human_like: false,
            other: "",
          })),
        )
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load session messages")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [adminKey, experimentId, selectedSessionId])

  const setRow = (messageId: string, patch: Partial<AnnotationRow>) => {
    setRows((prev) => prev.map((row) => (row.message_id === messageId ? { ...row, ...patch } : row)))
  }

  const handleDownloadCSV = () => {
    const header = [
      "message",
      "incivility",
      "hate_speech",
      "threats_to_dem_freedom",
      "impoliteness",
      "stance",
      "human_like",
      "other",
    ]
    const body = rows.map((row) => [
      row.message,
      row.incivility ? "1" : "0",
      row.hate_speech ? "1" : "0",
      row.threats_to_dem_freedom ? "1" : "0",
      row.impoliteness ? "1" : "0",
      row.stance,
      row.human_like ? "1" : "0",
      row.other,
    ])
    const csv = [header, ...body].map((line) => line.map((value) => csvEscape(value)).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selectedSessionId || "session"}_evaluation.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadSummaryCSV = () => {
    const totals = rows.reduce(
      (acc, row) => {
        acc.total_messages += 1
        if (row.incivility) acc.incivility_count += 1
        if (row.hate_speech) acc.hate_speech_count += 1
        if (row.threats_to_dem_freedom) acc.threats_to_democracy_count += 1
        if (row.impoliteness) acc.impoliteness_count += 1
        return acc
      },
      {
        total_messages: 0,
        incivility_count: 0,
        hate_speech_count: 0,
        threats_to_democracy_count: 0,
        impoliteness_count: 0,
      },
    )

    const pct = (value: number, total: number) => (total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "")

    const header = [
      "session_id",
      "experiment_id",
      "n_messages",
      "n_incivility",
      "n_hate_speech",
      "n_impoliteness",
      "n_threats_to_democracy",
      "perc_incivility",
      "perc_hate_speech",
      "perc_impoliteness",
      "perc_threats_to_democracy",
    ]
    const row = [
      selectedSessionId || "",
      experimentId,
      String(totals.total_messages),
      String(totals.incivility_count),
      String(totals.hate_speech_count),
      String(totals.impoliteness_count),
      String(totals.threats_to_democracy_count),
      pct(totals.incivility_count, totals.total_messages),
      pct(totals.hate_speech_count, totals.total_messages),
      pct(totals.impoliteness_count, totals.total_messages),
      pct(totals.threats_to_democracy_count, totals.total_messages),
    ]

    const csv = [header, row].map((line) => line.map((value) => csvEscape(value)).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selectedSessionId || "session"}_summary.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="bg-admin-surface rounded-lg border border-admin-border px-4 py-3 flex items-center gap-3 flex-wrap">
        <label className="text-xs font-medium text-admin-faint uppercase tracking-wider">Session</label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="text-xs font-mono border border-admin-border rounded-lg px-3 py-1.5 bg-admin-surface text-admin-text"
        >
          {endedSessions.length === 0 ? (
            <option value="">No completed sessions</option>
          ) : (
            endedSessions.map((session) => (
              <option key={session.session_id} value={session.session_id}>
                {session.session_id.slice(0, 8)}... ({session.treatment_group})
              </option>
            ))
          )}
        </select>
        <div className="flex-1" />
        <button
          onClick={handleDownloadCSV}
          disabled={rows.length === 0}
          className="px-3 py-1.5 text-xs font-medium bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download evaluation CSV
        </button>
        <button
          onClick={handleDownloadSummaryCSV}
          disabled={rows.length === 0}
          className="px-3 py-1.5 text-xs font-medium border border-admin-border text-admin-text rounded-lg hover:bg-admin-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download summary CSV
        </button>
      </div>

      {loading ? (
        <div className="bg-admin-surface rounded-lg border border-admin-border p-4 text-sm text-admin-faint">
          Loading messages...
        </div>
      ) : error ? (
        <div className="bg-admin-surface rounded-lg border border-admin-border p-4 text-sm text-red-600">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-admin-surface rounded-lg border border-admin-border p-4 text-sm text-admin-faint">
          No messages available for evaluation.
        </div>
      ) : (
        <div className="bg-admin-surface rounded-lg border border-admin-border overflow-x-auto">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="text-left text-[10px] text-admin-faint uppercase tracking-wider border-b border-admin-border">
                <th className="px-3 py-2">Sender</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-3 py-2 text-center">Incivility</th>
                <th className="px-3 py-2 text-center">Hate Speech</th>
                <th className="px-3 py-2 text-center">Threats</th>
                <th className="px-3 py-2 text-center">Impoliteness</th>
                <th className="px-3 py-2">Stance</th>
                <th className="px-3 py-2 text-center">Human Like</th>
                <th className="px-3 py-2">Other</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.message_id} className="border-b border-admin-border/50 align-top">
                  <td className="px-3 py-2 font-mono text-admin-faint whitespace-nowrap">{row.sender}</td>
                  <td className="px-3 py-2 text-admin-text max-w-[500px] whitespace-pre-wrap">{row.message}</td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.incivility} onChange={(e) => setRow(row.message_id, { incivility: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.hate_speech} onChange={(e) => setRow(row.message_id, { hate_speech: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.threats_to_dem_freedom} onChange={(e) => setRow(row.message_id, { threats_to_dem_freedom: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.impoliteness} onChange={(e) => setRow(row.message_id, { impoliteness: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.stance}
                      onChange={(e) => setRow(row.message_id, { stance: e.target.value as Stance })}
                      className="border border-admin-border rounded px-2 py-1 bg-admin-surface text-admin-text"
                    >
                      <option value="">-</option>
                      <option value="pro">pro</option>
                      <option value="anti">anti</option>
                      <option value="neutral">neutral</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.human_like} onChange={(e) => setRow(row.message_id, { human_like: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.other}
                      onChange={(e) => setRow(row.message_id, { other: e.target.value })}
                      className="w-full border border-admin-border rounded px-2 py-1 bg-admin-surface text-admin-text"
                      placeholder="Notes"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
