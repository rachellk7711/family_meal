'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="text-zinc-800 dark:text-zinc-200 leading-relaxed text-[15px] whitespace-pre-wrap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-3 border-b pb-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-2.5 text-zinc-900 dark:text-zinc-50" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-zinc-900 dark:text-zinc-50" {...props} />
          ),
          p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1.5" style={{ listStyleType: 'disc' }} {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5" style={{ listStyleType: 'decimal' }} {...props} />,
          li: ({ ...props }) => <li className="mb-0.5" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-amber-500 pl-4 italic my-4 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 py-2 pr-3 rounded-r-md" {...props} />
          ),
          code: ({ ...props }) => (
            <code className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-sm font-mono text-amber-600 dark:text-amber-400 border border-zinc-200/50 dark:border-zinc-800/50" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-left font-semibold text-zinc-700 dark:text-zinc-300" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border-b border-zinc-100 dark:border-zinc-900 px-4 py-2 text-zinc-600 dark:text-zinc-400" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
