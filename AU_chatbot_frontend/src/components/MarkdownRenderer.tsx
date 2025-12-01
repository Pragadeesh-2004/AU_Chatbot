"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // ✅ Improved preprocessing for better markdown alignment
  const preprocessContent = (text: string): string => {
    if (!text) return "";
    
    // 1. Convert \[ ... \] to $$ ... $$ (display math)
    text = text.replace(/\\\[\s*/g, "$$");
    text = text.replace(/\s*\\\]/g, "$$");
    
    // 2. Ensure proper spacing around display math
    text = text.replace(/([^\n])\$\$/g, "$1\n$$");
    text = text.replace(/\$\$([^\n])/g, "$$\n$1");
    
    // 3. Ensure proper spacing around headers
    text = text.replace(/([^\n])(#{1,6}\s)/g, "$1\n$2");
    text = text.replace(/(#{1,6}\s[^\n])([^\n])/g, "$1\n$2");
    
    // 4. Normalize list indentation
    text = text.split('\n').map(line => {
      // Fix nested list indentation
      const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
      if (match) {
        const [, indent, marker, content] = match;
        // Ensure consistent 2-space indentation for nested lists
        const level = Math.floor(indent.length / 2);
        return '  '.repeat(level) + marker + ' ' + content;
      }
      return line;
    }).join('\n');
    
    // 5. Clean up multiple newlines
    text = text.replace(/\n{3,}/g, "\n\n");
    
    return text;
  };

  const processedContent = preprocessContent(content);

  return (
    <div className="markdown-content prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[
          [remarkMath, { singleDollarTextMath: false }],
          remarkGfm
        ]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              output: "htmlAndMathml",
              throwOnError: false,
              strict: false,
              macros: {
                "\\text": "\\mathrm"
              }
            }
          ]
        ]}
        components={{
          // ✅ Style headings with proper spacing
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold text-cyan-100 mt-4 mb-3 pt-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold text-cyan-100 mt-3 mb-2 pt-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold text-cyan-100 mt-2 mb-2 pt-1" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold text-cyan-100 mt-2 mb-1 pt-1" {...props} />
          ),

          // ✅ Improved paragraph spacing
          p: ({ node, ...props }) => (
            <p className="text-cyan-100 my-2 leading-relaxed" {...props} />
          ),

          // ✅ Fixed: Removed duplicate ul definition - kept improved version with nested support
          ul: ({ node, ordered, ...props }: any) => (
            <ul 
              className={`list-disc text-cyan-100 my-2 space-y-1 ml-4`} 
              style={{ marginLeft: '1.5rem' }} 
              {...props} 
            />
          ),
          
          ol: ({ node, ...props }) => (
            <ol className="list-decimal text-cyan-100 my-2 space-y-1 ml-4" {...props} />
          ),
          
          li: ({ node, ...props }) => (
            <li className="text-cyan-100 ml-2" {...props} />
          ),

          // ✅ Style code blocks with better formatting
          code: ({ node, inline, className, ...props }: any) => {
            if (inline) {
              return (
                <code 
                  className="bg-blue-800/60 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono border border-blue-700/50" 
                  {...props} 
                />
              );
            }

            return (
              <code 
                className="bg-blue-950/80 text-cyan-300 p-4 rounded-lg block overflow-x-auto text-sm font-mono my-3 border border-blue-800/50 whitespace-pre-wrap break-words" 
                {...props} 
              />
            );
          },

          pre: ({ node, ...props }) => (
            <pre 
              className="bg-blue-950/80 text-cyan-300 p-4 rounded-lg overflow-x-auto my-3 border border-blue-800/50" 
              {...props} 
            />
          ),

          // ✅ Style blockquotes with better alignment
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-cyan-500 pl-4 py-2 text-cyan-200 italic my-2 bg-blue-900/20 rounded ml-0" 
              {...props} 
            />
          ),

          // ✅ Style links
          a: ({ node, ...props }) => (
            <a 
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer transition-colors" 
              {...props} 
            />
          ),

          // ✅ Style tables with proper alignment
          table: ({ node, ...props }) => (
            <table 
              className="border-collapse border border-blue-700 my-3 text-cyan-100 text-sm w-full" 
              {...props} 
            />
          ),
          th: ({ node, ...props }) => (
            <th 
              className="border border-blue-700 bg-blue-900/60 px-3 py-2 text-left font-semibold text-cyan-200" 
              {...props} 
            />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-blue-700 px-3 py-2 text-cyan-100" {...props} />
          ),

          // ✅ Style horizontal rules
          hr: () => (
            <hr className="border-blue-700 my-4" />
          ),

          // ✅ Style emphasis
          strong: ({ node, ...props }) => (
            <strong className="text-cyan-100 font-bold" {...props} />
          ),

          em: ({ node, ...props }) => (
            <em className="text-cyan-200 italic" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}