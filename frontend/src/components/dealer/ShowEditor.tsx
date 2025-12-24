"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Show {
  id: string;
  name: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

interface Card {
  id: string;
  notes?: string | null;
  buy_price?: number | null;
  asking_price?: number | null;
  sale_price?: number | null;
  status: string;
}

interface ShowEditorProps {
  show: Show;
  cards: Card[];
}

export default function ShowEditor({ show: initialShow, cards: initialCards }: ShowEditorProps) {
  const router = useRouter();
  const [show, setShow] = useState(initialShow);
  const [cards, setCards] = useState(initialCards);
  const [isEditingShow, setIsEditingShow] = useState(false);
  const [editFormData, setEditFormData] = useState(initialShow);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveShow = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dealer/shows/${show.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        const { show: updatedShow } = await res.json();
        setShow(updatedShow);
        setIsEditingShow(false);
      }
    } catch (error) {
      console.error("Failed to update show:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShow = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dealer/shows/${show.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dealer/shows");
      }
    } catch (error) {
      console.error("Failed to delete show:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCardPrice = async (
    cardId: string,
    field: "buy_price" | "asking_price" | "sale_price",
    value: number | null
  ) => {
    try {
      const res = await fetch("/api/dealer/show-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: cardId,
          [field]: value,
        }),
      });

      if (res.ok) {
        setCards(
          cards.map((c) =>
            c.id === cardId ? { ...c, [field]: value } : c
          )
        );
        setUpdatingCardId(null);
      }
    } catch (error) {
      console.error("Failed to update card price:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Show Header with Edit/Delete */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          {isEditingShow ? (
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="text-2xl md:text-3xl font-semibold bg-slate-800 border border-slate-700 rounded px-3 py-1 text-slate-100 w-full"
            />
          ) : (
            <h1 className="text-2xl md:text-3xl font-semibold">{show.name}</h1>
          )}
          {isEditingShow ? (
            <input
              type="text"
              value={editFormData.location || ""}
              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              placeholder="Location"
              className="text-sm bg-slate-800 border border-slate-700 rounded px-3 py-1 text-slate-300 w-full"
            />
          ) : (
            <p className="text-sm text-slate-300">
              {show.location || "Location TBA"}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {isEditingShow ? (
            <>
              <button
                onClick={() => {
                  setIsEditingShow(false);
                  setEditFormData(show);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShow}
                className="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditingShow(true)}
                className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Show?</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will delete the show and all associated cards. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteShow}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards Table with Price Editing */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400 uppercase tracking-[0.16em]">
          Cards in this show
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-2 py-2 text-left">Card</th>
                <th className="px-2 py-2 text-right">Buy Price</th>
                <th className="px-2 py-2 text-right">Ask Price</th>
                <th className="px-2 py-2 text-right">Sale Price</th>
                <th className="px-2 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {cards.map((c) => (
                <tr key={c.id}>
                  <td className="px-2 py-2">
                    <span className="text-slate-100">{c.notes || "Card"}</span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    {updatingCardId === `${c.id}-buy` ? (
                      <input
                        type="number"
                        defaultValue={c.buy_price || ""}
                        onBlur={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null;
                          handleUpdateCardPrice(c.id, "buy_price", value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value
                              ? Number((e.target as HTMLInputElement).value)
                              : null;
                            handleUpdateCardPrice(c.id, "buy_price", value);
                          }
                          if (e.key === "Escape") {
                            setUpdatingCardId(null);
                          }
                        }}
                        autoFocus
                        className="w-20 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100"
                      />
                    ) : (
                      <button
                        onClick={() => setUpdatingCardId(`${c.id}-buy`)}
                        className="text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        {c.buy_price != null ? `$${Number(c.buy_price).toFixed(0)}` : "-"}
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {updatingCardId === `${c.id}-ask` ? (
                      <input
                        type="number"
                        defaultValue={c.asking_price || ""}
                        onBlur={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null;
                          handleUpdateCardPrice(c.id, "asking_price", value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value
                              ? Number((e.target as HTMLInputElement).value)
                              : null;
                            handleUpdateCardPrice(c.id, "asking_price", value);
                          }
                          if (e.key === "Escape") {
                            setUpdatingCardId(null);
                          }
                        }}
                        autoFocus
                        className="w-20 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100"
                      />
                    ) : (
                      <button
                        onClick={() => setUpdatingCardId(`${c.id}-ask`)}
                        className="text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        {c.asking_price != null ? `$${Number(c.asking_price).toFixed(0)}` : "-"}
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {updatingCardId === `${c.id}-sale` ? (
                      <input
                        type="number"
                        defaultValue={c.sale_price || ""}
                        onBlur={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null;
                          handleUpdateCardPrice(c.id, "sale_price", value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value
                              ? Number((e.target as HTMLInputElement).value)
                              : null;
                            handleUpdateCardPrice(c.id, "sale_price", value);
                          }
                          if (e.key === "Escape") {
                            setUpdatingCardId(null);
                          }
                        }}
                        autoFocus
                        className="w-20 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100"
                      />
                    ) : (
                      <button
                        onClick={() => setUpdatingCardId(`${c.id}-sale`)}
                        className="text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        {c.sale_price != null ? `$${Number(c.sale_price).toFixed(0)}` : "-"}
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-400">
                    {c.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
