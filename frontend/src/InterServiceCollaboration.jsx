import React, { useState, useEffect } from "react";
import { Send, RefreshCw, Image as ImageIcon, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

export default function InterServiceCollaboration() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ticketId, setTicketId] = useState("CF-2026-LIVE");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const [receivedImages, setReceivedImages] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");

  const fetchReceivedImages = async () => {
    setFeedLoading(true);
    setFeedError("");
    try {
      const res = await fetch("https://civicfix-t3mx.onrender.com/api/external/received-feed");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReceivedImages(data.images || []);
    } catch (err) {
      console.error("Failed to load feed:", err);
      setFeedError("Could not reach backend feed endpoint.");
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivedImages();
  }, []);

  const handleSendImage = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please choose an image file first.");
      return;
    }

    setSendLoading(true);
    setSendResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("ticket_id", ticketId);

    try {
      const res = await fetch("https://civicfix-t3mx.onrender.com/api/external/send-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Dispatch failed");
      setSendResult({ success: true, data });
    } catch (err) {
      setSendResult({ success: false, error: err.message });
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: OUTBOUND SEND */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Send Image Evidence to BuildWise</h2>
            <p className="text-xs text-slate-400">Pushes local images to the BuildWise partner upload endpoint</p>
          </div>
        </div>

        <form onSubmit={handleSendImage} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Ticket Identifier
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Select Local Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sendLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            {sendLoading ? "Dispatching to BuildWise..." : "Transmit Evidence Outward"}
          </button>
        </form>

        {sendResult && (
          <div className={`mt-4 p-4 rounded-xl border text-xs ${
            sendResult.success 
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300" 
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}>
            {sendResult.success ? (
              <div>
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Transmitted Successfully to BuildWise!
                </p>
                <p className="font-mono text-[11px] text-emerald-200 mt-1 break-all">
                  Target URL: {sendResult.data.file_url}
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Error: {sendResult.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: INBOUND RECEIVED FEED GALLERY */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-lg backdrop-blur">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Received Partner Evidence Gallery</h2>
              <p className="text-xs text-slate-400">All image files received and hosted on CivicFix (including BuildWise submissions)</p>
            </div>
          </div>

          <button
            onClick={fetchReceivedImages}
            disabled={feedLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:text-teal-300 text-xs rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${feedLoading ? "animate-spin text-teal-400" : ""}`} />
            {feedLoading ? "Syncing..." : "Refresh Feed"}
          </button>
        </div>

        {feedError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl mb-4">
            {feedError}
          </div>
        )}

        {receivedImages.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center text-slate-400 text-xs">
            No received images found yet in the uploads repository.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {receivedImages.map((img, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden flex flex-col group hover:border-slate-600 transition">
                <div className="h-44 w-full bg-black/60 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-3 flex justify-between items-center text-[11px] border-t border-slate-800">
                  <span className="font-mono text-slate-300 truncate max-w-[160px]" title={img.filename}>
                    {img.filename}
                  </span>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
