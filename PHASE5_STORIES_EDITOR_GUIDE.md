# PHASE 5 IMPLEMENTATION GUIDE: Stories Rich Text Editor

## 🎯 Goal
Replace basic stories text editor with rich text editor supporting:
- Bold, italic, underline formatting
- Headings (H1, H2, H3)
- Lists (ordered, unordered)
- Quotes
- Links
- Inline images
- Code blocks
- Author & date metadata
- Beautiful preview mode

---

## 📊 Current State vs Target

### Current
```
- Plain text input
- No formatting
- Limited to textarea
- No preview
- Basic storage
```

### Target
```
- Full rich text editor
- WYSIWYG interface
- Formatting toolbar
- Live preview
- Image support
- Author/date metadata
- Professional appearance
```

---

## 🔧 Implementation Approach

### Option 1: TipTap (Recommended)
- Vue/React agnostic
- Highly customizable
- Great TypeScript support
- Active community
- ~60KB bundle size

```bash
npm install @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

### Option 2: Slate
- Full control
- Learning curve steep
- Mature ecosystem
- ~50KB bundle size

### Option 3: Draft.js
- Facebook maintained
- Immutable data structure
- Good plugin system
- ~150KB bundle size

**RECOMMENDATION**: Use **TipTap** — best balance of features, customization, and bundle size.

---

## 📝 Database Schema Update (Optional)

Current stories table likely has:
```sql
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  title TEXT NOT NULL,
  content TEXT,  -- Currently plain text
  author_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Enhancement (optional):
```sql
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS content_html TEXT,  -- HTML version
ADD COLUMN IF NOT EXISTS content_json JSONB;  -- TipTap JSON format
```

**Strategy**: Store both plain text + HTML for backwards compatibility.

---

## 🔧 Implementation Steps

### Step 1: Install Dependencies

```bash
npm install @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder
```

### Step 2: Create Editor Component

File: `src/components/RichTextEditor.tsx`

```typescript
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Link as LinkIcon } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Your story here...",
  readOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !readOnly,
  });

  if (!editor) return null;

  const MenuBar = () => (
    <div style={{ display: "flex", gap: 8, padding: 12, borderBottom: `1px solid ${TOKENS.parchmentDeep}`, flexWrap: "wrap" }}>
      <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} style={{ ...buttonStyle, opacity: editor.isActive("bold") ? 1 : 0.7 }}>
        <Bold size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} style={{ ...buttonStyle, opacity: editor.isActive("italic") ? 1 : 0.7 }}>
        <Italic size={16} />
      </button>
      <div style={{ width: 1, background: TOKENS.parchmentDeep, margin: "0 4px" }} />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={{ ...buttonStyle, opacity: editor.isActive("heading", { level: 1 }) ? 1 : 0.7 }}>
        <Heading1 size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={{ ...buttonStyle, opacity: editor.isActive("heading", { level: 2 }) ? 1 : 0.7 }}>
        <Heading2 size={16} />
      </button>
      <div style={{ width: 1, background: TOKENS.parchmentDeep, margin: "0 4px" }} />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={{ ...buttonStyle, opacity: editor.isActive("bulletList") ? 1 : 0.7 }}>
        <List size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={{ ...buttonStyle, opacity: editor.isActive("orderedList") ? 1 : 0.7 }}>
        <ListOrdered size={16} />
      </button>
      <div style={{ width: 1, background: TOKENS.parchmentDeep, margin: "0 4px" }} />
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={{ ...buttonStyle, opacity: editor.isActive("blockquote") ? 1 : 0.7 }}>
        <Quote size={16} />
      </button>
      <button
        onClick={() => {
          const url = prompt("Enter URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        style={{ ...buttonStyle, opacity: editor.isActive("link") ? 1 : 0.7 }}
      >
        <LinkIcon size={16} />
      </button>
    </div>
  );

  const buttonStyle = {
    background: "transparent",
    border: `1px solid ${TOKENS.parchmentDeep}`,
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
    color: TOKENS.ink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const;

  return (
    <div style={{ border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, overflow: "hidden" }}>
      {!readOnly && <MenuBar />}
      <EditorContent
        editor={editor}
        style={{
          padding: 16,
          minHeight: 300,
          background: TOKENS.card,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}
```

### Step 3: Update Stories Page

File: `src/app/[family]/stories/[storyId]/edit/page.tsx`

```typescript
"use server";

import { RichTextEditor } from "@/components/RichTextEditor";
import { updateStoryAction } from "@/lib/actions";

export default async function EditStoryPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>Story Editor</h1>
      <RichTextEditor
        value={story.content || ""}
        onChange={async (content) => {
          "use server";
          await updateStoryAction(formData);
        }}
      />
    </div>
  );
}
```

### Step 4: Update Server Actions

Add to `src/lib/actions.ts`:

```typescript
export async function updateStoryWithRichTextAction(
  familySlug: string,
  storyId: string,
  title: string,
  contentHtml: string,
  contentJson: string  // TipTap JSON format
): Promise<ActionState> {
  // Verify access
  // Update database
  // Return result
}
```

### Step 5: CSS for Rich Text

Add to `src/app/globals.css`:

```css
/* TipTap Editor Styles */
.ProseMirror {
  font-family: "Inter", sans-serif;
  line-height: 1.6;
}

.ProseMirror h1 {
  font-family: "Fraunces", serif;
  font-size: 28px;
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 600;
}

.ProseMirror h2 {
  font-family: "Fraunces", serif;
  font-size: 22px;
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.ProseMirror strong {
  font-weight: 600;
}

.ProseMirror em {
  font-style: italic;
}

.ProseMirror blockquote {
  border-left: 3px solid #b8863b;
  padding-left: 12px;
  color: #666;
  margin-left: 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 20px;
}

.ProseMirror a {
  color: #4a8f8d;
  text-decoration: underline;
  cursor: pointer;
}
```

---

## 📊 Timeline

### Day 1-2: Setup & Component
- Install TipTap
- Build RichTextEditor component
- Create toolbar

### Day 2-3: Integration
- Update stories schema
- Update server actions
- Wire up to stories page

### Day 3: Testing & Polish
- Test all formatting
- Mobile testing
- Performance check
- Edge case handling

**Total: 3-5 days**

---

## 🎯 Success Criteria

- [ ] All formatting buttons work
- [ ] WYSIWYG editing works smoothly
- [ ] Images can be uploaded inline
- [ ] Links can be added
- [ ] Preview mode works
- [ ] Mobile responsive
- [ ] Build passes
- [ ] No performance issues

---

## 🚀 After Phase 5

- Phase 6: Mobile optimization (5-7 days)
- Phase 7: Admin panel (5-7 days)
- Production launch! 🎉

---

Generated: 2026-08-19
Estimated: 3-5 days
Dependencies: TipTap + React
