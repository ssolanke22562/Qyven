"use client";

import React, { useState } from "react";
import { X, Star, Send, CheckCircle2, UserCheck } from "lucide-react";

interface HumanEvalModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  query: string;
  onSubmitted?: () => void;
}

export function HumanEvalModal({ isOpen, onClose, caseId, query, onSubmitted }: HumanEvalModalProps) {
  const [evaluatorName, setEvaluatorName] = useState("");
  const [accuracy, setAccuracy] = useState(5);
  const [evidenceQuality, setEvidenceQuality] = useState(5);
  const [groundedness, setGroundedness] = useState(5);
  const [taskCompletion, setTaskCompletion] = useState(5);
  const [clarity, setClarity] = useState(5);
  const [trustworthiness, setTrustworthiness] = useState(5);
  const [passed, setPassed] = useState(true);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/eval/human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          evaluatorName: evaluatorName.trim() || "Hackathon Judge",
          accuracy,
          evidenceQuality,
          groundedness,
          taskCompletion,
          clarity,
          trustworthiness,
          passed,
          comments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      setSuccess(true);
      if (onSubmitted) onSubmitted();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
      <span className="text-xs font-mono text-slate-300">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform focus:outline-none"
          >
            <Star
              className={`w-4 h-4 ${star <= value ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
            />
          </button>
        ))}
        <span className="ml-1.5 font-mono text-xs font-bold text-amber-400">{value}/5</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-violet-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-violet-400" />
            <h3 className="font-heading font-bold text-white text-base">Human Evaluation Reviewer</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm font-sans">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Evaluating Case {caseId}</div>
            <div className="text-slate-200 text-xs mt-0.5 line-clamp-2">&ldquo;{query}&rdquo;</div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
              <div className="font-heading font-bold text-emerald-300 text-lg">Review Submitted Successfully!</div>
              <p className="text-xs text-slate-300 font-mono">Aggregated scorecard updated in real-time.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Evaluator Name / Identifier</label>
                <input
                  type="text"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  placeholder="e.g. Hackathon Judge #1"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 1-5 Ratings */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-violet-300 uppercase">Rate Agent Performance (1–5 Scale)</div>
                <StarRating label="Accuracy" value={accuracy} onChange={setAccuracy} />
                <StarRating label="Evidence Quality" value={evidenceQuality} onChange={setEvidenceQuality} />
                <StarRating label="Groundedness" value={groundedness} onChange={setGroundedness} />
                <StarRating label="Task Completion" value={taskCompletion} onChange={setTaskCompletion} />
                <StarRating label="Clarity" value={clarity} onChange={setClarity} />
                <StarRating label="Trustworthiness" value={trustworthiness} onChange={setTrustworthiness} />
              </div>

              {/* Pass / Fail Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs font-mono text-slate-300">Overall Recommendation</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPassed(true)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold ${passed ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}
                  >
                    PASS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassed(false)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold ${!passed ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"}`}
                  >
                    FAIL
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Qualitative Feedback / Notes</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Provide qualitative feedback on reasoning, evidence citation quality, or uncertainty detection..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all shadow-violet-glow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Submitting..." : "Submit Review"}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
