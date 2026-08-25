import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { esApi, getErrorMessage } from "../services/esApi";
import type { DeleteResult, IndexInfo } from "../types/es";
import { useConnection } from "../context/ConnectionContext";

export type HealthFilter = "all" | "green" | "yellow" | "red";
export type SortKey = "name" | "health" | "docsCount" | "storeBytes";
type SortDir = "asc" | "desc";

export function useIndices() {
  const { status, activeId } = useConnection();
  const [query, setQuery] = useState("");
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const queryRef = useRef(query);
  queryRef.current = query;

  const search = useCallback(async (nextQuery?: string) => {
    const q = nextQuery ?? queryRef.current;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const rows = await esApi.searchIndices(q);
      setIndices(rows);
      setSelected((current) =>
        current.filter((name) => rows.some((row) => row.name === name)),
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setIndices([]);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "connected") {
      setQuery("");
      void search("");
      return;
    }
    setQuery("");
    setIndices([]);
    setSelected([]);
    setError(null);
    setNotice(null);
  }, [status, activeId, search]);

  const visibleIndices = useMemo(() => {
    const filtered =
      healthFilter === "all"
        ? indices
        : indices.filter((item) => item.health === healthFilter);

    const sorted = [...filtered].sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name" || sortKey === "health") {
        return a[sortKey].localeCompare(b[sortKey]) * direction;
      }
      return (a[sortKey] - b[sortKey]) * direction;
    });

    return sorted;
  }, [indices, healthFilter, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((current) => {
      if (current === key) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        return current;
      }
      setSortDir(key === "name" ? "asc" : "desc");
      return key;
    });
  }, []);

  const toggleSelect = useCallback((name: string) => {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((current) => {
      const visibleNames = visibleIndices.map((item) => item.name);
      const allSelected = visibleNames.every((name) => current.includes(name));
      if (allSelected) {
        return current.filter((name) => !visibleNames.includes(name));
      }
      return Array.from(new Set([...current, ...visibleNames]));
    });
  }, [visibleIndices]);

  const deleteSelected = useCallback(async (): Promise<DeleteResult | null> => {
    if (selected.length === 0) {
      return null;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await esApi.deleteIndices(selected);
      const deletedCount = result.deleted.length;
      const failedCount = result.failed.length;

      if (failedCount === 0) {
        setNotice(`已删除 ${deletedCount} 个索引`);
      } else {
        const failedNames = result.failed
          .map((item) => `${item.index}（${item.message}）`)
          .join("；");
        setError(
          `成功删除 ${deletedCount} 个，失败 ${failedCount} 个：${failedNames}`,
        );
      }

      await search();
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setDeleting(false);
    }
  }, [selected, search]);

  return {
    query,
    setQuery,
    visibleIndices,
    selected,
    loading,
    deleting,
    error,
    notice,
    healthFilter,
    setHealthFilter,
    sortKey,
    sortDir,
    toggleSort,
    search,
    toggleSelect,
    toggleSelectAll,
    deleteSelected,
  };
}
