import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Link2, RemoveFormatting } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder = 'Write content...', label }) {
  const editorRef = useRef(null);

  // Sync value from prop to editor only when it changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command, arg = null) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleAddLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[10px] text-gray-555 font-bold uppercase tracking-wider">{label}</label>
      )}
      
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col focus-within:border-primary transition-all">
        <style>{`
          .rich-editor[contenteditable]:empty:before {
            content: attr(placeholder);
            color: #9ca3af;
            cursor: text;
          }
          .rich-editor ul {
            list-style-type: disc !important;
            padding-left: 1.5rem !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .rich-editor ol {
            list-style-type: decimal !important;
            padding-left: 1.5rem !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .rich-editor h1 {
            font-size: 1.25rem !important;
            font-weight: bold !important;
            margin-top: 0.75rem !important;
            margin-bottom: 0.5rem !important;
          }
          .rich-editor h2 {
            font-size: 1.1rem !important;
            font-weight: bold !important;
            margin-top: 0.75rem !important;
            margin-bottom: 0.5rem !important;
          }
          .rich-editor a {
            color: var(--color-primary, #C5A880) !important;
            text-decoration: underline !important;
          }
        `}</style>

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-150 p-2 flex flex-wrap gap-1 items-center shrink-0">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h1>')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Unordered List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Ordered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={handleAddLink}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Insert Link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('removeFormat')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Editable Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="rich-editor p-3.5 min-h-[160px] max-h-[350px] overflow-y-auto focus:outline-none text-xs text-gray-800 leading-relaxed font-sans"
          placeholder={placeholder}
          style={{ outline: 'none' }}
        />
      </div>
    </div>
  );
}
