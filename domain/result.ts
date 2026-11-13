import type { DomainErrorCode, DomainResult } from "@/types";

/** 成功Resultを生成する */
export const ok = <T>(data: T): DomainResult<T> => ({
  ok: true,
  data,
});

/** 失敗Resultを生成する */
export const err = (
  code: DomainErrorCode,
  message: string,
): DomainResult<never> => ({
  ok: false,
  error: { code, message },
});
