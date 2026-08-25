import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "../context/ConnectionContext";
import { esApi, getErrorMessage } from "../services/esApi";
import {
  emptyTtlRule,
  type TtlMatch,
  type TtlRule,
} from "../types/es";
import { loadTtlRules, saveTtlRules } from "../utils/ttlStore";

function validatePattern(pattern: string): string | null {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return "正则表达式不能为空";
  }
  try {
    new RegExp(trimmed);
    return null;
  } catch {
    return "正则表达式无效";
  }
}

export function useExpirationRules() {
  const { activeId, status } = useConnection();
  const connected = status === "connected";
  const canEdit = Boolean(activeId);
  const [rules, setRules] = useState<TtlRule[]>([]);
  const [form, setForm] = useState<TtlRule>(emptyTtlRule);
  const [matches, setMatches] = useState<TtlMatch[]>([]);
  const [expiredCount, setExpiredCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setRules(loadTtlRules(activeId));
    setForm(emptyTtlRule());
    setMatches([]);
    setExpiredCount(0);
    setError(null);
    setNotice(null);
  }, [activeId]);

  const enabledRules = useMemo(
    () => rules.filter((rule) => rule.enabled),
    [rules],
  );

  const persist = useCallback(
    (next: TtlRule[]) => {
      setRules(next);
      if (activeId) {
        saveTtlRules(activeId, next);
      }
    },
    [activeId],
  );

  const saveRule = useCallback(() => {
    const patternError = validatePattern(form.pattern);
    if (patternError) {
      setError(patternError);
      return null;
    }
    if (!form.ttlValue || form.ttlValue <= 0) {
      setError("过期时间必须大于 0");
      return null;
    }

    const saved: TtlRule = {
      ...form,
      id: form.id || crypto.randomUUID(),
      name: form.name.trim() || form.pattern.trim(),
      pattern: form.pattern.trim(),
    };
    const exists = rules.some((item) => item.id === saved.id);
    persist(exists ? rules.map((item) => (item.id === saved.id ? saved : item)) : [...rules, saved]);
    setForm(saved);
    setError(null);
    setNotice("已保存过期规则");
    return saved;
  }, [form, persist, rules]);

  const editRule = useCallback((id: string) => {
    const current = rules.find((item) => item.id === id);
    if (current) {
      setForm(current);
      setNotice(null);
      setError(null);
    }
  }, [rules]);

  const toggleRule = useCallback(
    (id: string, enabled: boolean) => {
      persist(rules.map((item) => (item.id === id ? { ...item, enabled } : item)));
    },
    [persist, rules],
  );

  const removeRule = useCallback(
    (id: string) => {
      persist(rules.filter((item) => item.id !== id));
      if (form.id === id) {
        setForm(emptyTtlRule());
      }
      setNotice("已删除规则");
    },
    [form.id, persist, rules],
  );

  const preview = useCallback(async () => {
    if (!connected) {
      setError("请先连接集群");
      return;
    }
    if (enabledRules.length === 0) {
      setError("请先启用至少一条过期规则");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const result = await esApi.previewExpiration(enabledRules);
      setMatches(result.matches);
      setExpiredCount(result.expiredCount);
      setNotice(
        result.matches.length === 0
          ? "没有索引匹配当前规则"
          : `匹配 ${result.matches.length} 条，其中 ${result.expiredCount} 个索引已过期`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setMatches([]);
      setExpiredCount(0);
    } finally {
      setLoading(false);
    }
  }, [connected, enabledRules]);

  const apply = useCallback(async () => {
    if (!connected) {
      setError("请先连接集群");
      return null;
    }
    setApplying(true);
    setError(null);
    setNotice(null);
    try {
      const result = await esApi.applyExpiration(enabledRules);
      const failedCount = result.failed.length;
      if (failedCount === 0) {
        setNotice(
          result.deleted.length === 0
            ? "没有需要清理的过期索引"
            : `已删除 ${result.deleted.length} 个过期索引`,
        );
      } else {
        setError(
          `成功删除 ${result.deleted.length} 个，失败 ${failedCount} 个：${result.failed
            .map((item) => `${item.index}（${item.message}）`)
            .join("；")}`,
        );
      }
      const previewResult = await esApi.previewExpiration(enabledRules);
      setMatches(previewResult.matches);
      setExpiredCount(previewResult.expiredCount);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setApplying(false);
    }
  }, [connected, enabledRules]);

  return {
    connected,
    canEdit,
    rules,
    form,
    setForm,
    matches,
    expiredCount,
    loading,
    applying,
    error,
    notice,
    saveRule,
    editRule,
    toggleRule,
    removeRule,
    startCreate: () => {
      setForm(emptyTtlRule());
      setNotice(null);
      setError(null);
    },
    preview,
    apply,
  };
}
