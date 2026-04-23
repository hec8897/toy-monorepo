'use client';

import { useEffect } from 'react';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { Markdown } from 'tiptap-markdown';

const lowlight = createLowlight(common);

type MarkdownStorage = { markdown: { getMarkdown: () => string } };

function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
}

interface TiptapEditorProps {
  markdown: string;
  onChange: (markdown: string, text: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  markdown,
  onChange,
  placeholder,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      Markdown.configure({ html: true, tightLists: true }),
    ],
    content: markdown,
    onUpdate: ({ editor: ed }) => {
      onChange(getMarkdown(ed), ed.getText());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[200px] px-3 py-2 focus:outline-none',
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = getMarkdown(editor);
    if (markdown === '' && current !== '') {
      editor.commands.clearContent();
    }
  }, [editor, markdown]);

  if (!editor) {
    return (
      <div className="h-[244px] rounded-md border border-gray-300 bg-gray-50" />
    );
  }

  return (
    <div className="rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
}

function Toolbar({ editor }: ToolbarProps) {
  function toggleLink() {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('링크 URL 입력 (빈 값이면 해제)', prev ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  const buttons: Array<{
    label: string;
    title: string;
    isActive: () => boolean;
    onClick: () => void;
  }> = [
    {
      label: 'H2',
      title: '큰 제목',
      isActive: () => editor.isActive('heading', { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'H3',
      title: '작은 제목',
      isActive: () => editor.isActive('heading', { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'B',
      title: '굵게',
      isActive: () => editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'I',
      title: '기울임',
      isActive: () => editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'U',
      title: '밑줄',
      isActive: () => editor.isActive('underline'),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: '🔗',
      title: '링크',
      isActive: () => editor.isActive('link'),
      onClick: toggleLink,
    },
    {
      label: '`',
      title: '인라인 코드',
      isActive: () => editor.isActive('code'),
      onClick: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: '{}',
      title: '코드 블록',
      isActive: () => editor.isActive('codeBlock'),
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: '•',
      title: '불릿 목록',
      isActive: () => editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: '1.',
      title: '번호 목록',
      isActive: () => editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
      {buttons.map((btn) => (
        <button
          key={btn.title}
          type="button"
          title={btn.title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={btn.onClick}
          className={[
            'min-w-[32px] rounded px-2 py-1 text-xs font-medium transition',
            btn.isActive()
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-200',
          ].join(' ')}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
