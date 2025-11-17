import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-cyan-50 mb-3 mt-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-cyan-50 mb-2 mt-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-cyan-50 mb-2 mt-2" {...props} />,
          
          // Paragraphs
          p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-cyan-100" {...props} />,
          
          // Lists
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 text-cyan-100" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-cyan-100" {...props} />,
          li: ({ node, ...props }) => <li className="ml-4 text-cyan-100" {...props} />,
          
          // Links
          a: ({ node, ...props }) => (
            <a 
              className="text-cyan-400 hover:text-cyan-300 underline" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          
          // Pre element (wrapper for code blocks)
          pre: ({ node, ...props }) => (
            <pre className="bg-blue-950/50 border border-blue-800 rounded-lg p-3 my-2 overflow-x-auto" {...props} />
          ),
          
          // Code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code 
                  className="bg-blue-950/70 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono" 
                  {...props}
                >
                  {children}
                </code>
              );
            }
            // For block code, just return the code element
            // The pre styling is handled by the pre component above
            return (
              <code className="text-cyan-200 text-sm font-mono block" {...props}>
                {children}
              </code>
            );
          },
          
          // Tables
          table: ({ node, ...props }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse border border-blue-800 rounded-lg overflow-hidden" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-blue-900/50" {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-blue-900/30 transition-colors" {...props} />,
          th: ({ node, ...props }) => (
            <th className="border border-blue-800 px-4 py-2 text-cyan-100 font-semibold text-left" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-blue-800 px-4 py-2 text-cyan-200" {...props} />
          ),
          
          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-cyan-600 pl-4 italic text-cyan-200 my-2" 
              {...props} 
            />
          ),
          
          // Horizontal rule
          hr: ({ node, ...props }) => <hr className="border-blue-800 my-4" {...props} />,
          
          // Strong/Bold
          strong: ({ node, ...props }) => <strong className="font-bold text-cyan-50" {...props} />,
          
          // Emphasis/Italic
          em: ({ node, ...props }) => <em className="italic text-cyan-100" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};