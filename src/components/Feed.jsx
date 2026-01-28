import React, { useEffect, useRef, useState } from "react";

// Infinite scroll feed demo
export default function Feed() {
  const [items, setItems] = useState(() => Array.from({ length: 30 }, (_, i) => i + 1));
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    // fake fetch delay
    await new Promise((r) => setTimeout(r, 600));
    setItems((prev) => [
      ...prev,
      ...Array.from({ length: 20 }, (_, i) => prev.length + i + 1),
    ]);
    setLoading(false);
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const obs = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: null, rootMargin: "200px" }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [loading]);

  return (
    <div className="h-[70vh] overflow-y-auto border rounded-xl p-4 bg-gray-900 text-white">
      {items.map((n) => (
        <div key={n} className="py-2 border-b border-gray-700">Item {n}</div>
      ))}
      <div ref={sentinelRef} className="py-4 text-center">
        {loading ? "Loading..." : "Scroll more"}
      </div>
    </div>
  );
}
