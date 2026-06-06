"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Enabler 소개(bio) 마크다운 렌더러.
 * - react-markdown 기본값은 raw HTML을 렌더하지 않음(XSS 안전) → 그대로 사용.
 * - 링크는 새 탭(noopener) 으로 열기.
 * - 스타일은 globals.css의 `.bio-md` 클래스(본문 톤)를 따름.
 */
export default function BioMarkdown({ source }: { source: string }) {
  return (
    <div className="bio-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
