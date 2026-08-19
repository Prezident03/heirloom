# PHASE 4 IMPLEMENTATION GUIDE: Album Editor Refactor

## 🎯 Goal
Replace slot-based album editor with true drag-drop editor where users can:
- Drag elements freely on canvas
- Resize elements with handles
- Reorder elements via z-index controls
- Undo/redo support
- True scrapbook experience

---

## 📊 Current State vs Target

### Current (Slot-Based)
```
- Fixed 4 layout templates
- Elements fit into predefined slots
- Limited positioning
- Can't create custom layouts
- Feels constrictive
```

### Target (Drag-Drop)
```
- Free-form canvas
- Elements positioned at x, y with w, h
- Resizable with handles
- True creative freedom
- Professional scrapbooking feel
```

---

## 🔧 Implementation Steps

### Step 1: Database Schema Update

**Add positioning columns to page_elements:**

```sql
-- For existing data (backwards compatibility)
ALTER TABLE page_elements 
ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS position_w FLOAT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS position_h FLOAT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rotation FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 0;

-- Migrate old slot data to new positioning (migration script)
-- This will be done in a separate migration
```

**Migration Strategy:**
- Keep old `slot_index` for backwards compatibility
- When reading: if position_x is NULL, calculate from slot_index (legacy support)
- When writing: always set position_x, position_y, position_w, position_h
- Gradual migration as users edit pages

---

### Step 2: Create Editor Canvas Component

File: `src/components/AlbumEditorCanvas.tsx`

Key features:
- SVG or HTML5 Canvas for rendering
- Mouse event handling (drag, resize)
- Undo/redo stack
- Element selection
- Context menu

---

### Step 3: Update Server Actions

File: `src/lib/actions.ts` - add new actions:

```typescript
// Update element position
export async function updateElementPositionAction(
  familySlug: string,
  pageId: string,
  elementId: string,
  x: number,
  y: number,
  w: number,
  h: number,
  zIndex: number
)

// Batch update multiple elements (undo/redo)
export async function batchUpdateElementsAction(
  familySlug: string,
  pageId: string,
  updates: Array<{
    elementId: string,
    x: number,
    y: number,
    w: number,
    h: number,
    zIndex: number
  }>
)

// Create undo/redo snapshots
export async function getPageSnapshot(pageId: string)
export async function restorePageSnapshot(pageId: string, snapshotId: string)
```

---

### Step 4: UI/UX Design

**Editor Layout:**
```
┌─────────────────────────────────────┐
│ Toolbar: Undo/Redo/Delete/Layers    │
├──────────────┬──────────────────────┤
│              │                      │
│   Properties │   Canvas (Drag/Drop) │
│   Panel      │   (editable page)    │
│              │                      │
│   - Position │   Elements can be:   │
│   - Size     │   - Dragged          │
│   - Rotation │   - Resized          │
│   - Opacity  │   - Rotated          │
│   - Z-Index  │   - Deleted          │
│              │                      │
└──────────────┴──────────────────────┘
```

**Right Panel (when element selected):**
- Position X, Y (input fields)
- Size W, H (input fields)
- Rotation (slider 0-360°)
- Opacity (slider 0-100%)
- Z-Index (up/down buttons)
- Delete button

---

### Step 5: Mobile Experience

**Mobile Simplified Editor:**
- Single column layout
- Touch-friendly controls
- Simplified positioning (snapping grid)
- OR: Redirect to desktop warning

**Decision:** Start with desktop-only, add mobile support in Phase 6.

---

## 📈 Implementation Timeline

### Week 1
- [ ] Database schema update
- [ ] Migration scripts
- [ ] Server actions

### Week 2
- [ ] AlbumEditorCanvas component
- [ ] Drag/drop handling
- [ ] Resize functionality

### Week 3
- [ ] Properties panel
- [ ] Undo/redo
- [ ] Testing & polish

---

## 🎯 Success Criteria

- [ ] Can drag elements freely
- [ ] Can resize with handles
- [ ] Can reorder via z-index
- [ ] Undo/redo works (10+ steps)
- [ ] Mobile responsive (or explicitly desktop-only)
- [ ] Build passes
- [ ] No performance issues with 10+ elements
- [ ] Beautiful UI matching design system

---

## 🚀 API Endpoints Needed

### Update Element Position
```
POST /api/pages/[pageId]/elements/[elementId]/position
{
  x: number,
  y: number,
  w: number,
  h: number,
  zIndex: number
}
```

### Batch Update Elements
```
POST /api/pages/[pageId]/elements/batch
{
  updates: [
    { elementId, x, y, w, h, zIndex },
    ...
  ]
}
```

### Create Snapshot (for undo)
```
POST /api/pages/[pageId]/snapshots
→ returns { snapshotId, timestamp }
```

### Restore Snapshot
```
POST /api/pages/[pageId]/snapshots/[snapshotId]/restore
```

---

## 🎨 Design Tokens to Use

From `uiTokens.ts`:
- Canvas background: #FFFFFF (white)
- Selected element: border `2px solid ${TOKENS.gold}`
- Hover element: border `1px dashed ${TOKENS.parchmentDeep}`
- Resize handles: 8x8px squares at corners + edges
- Grid snapping: optional (every 10px)

---

## 📝 Database Migration Example

```typescript
// Migration: 0043_album_editor_positioning.sql
BEGIN;

ALTER TABLE page_elements 
ADD COLUMN position_x FLOAT,
ADD COLUMN position_y FLOAT,
ADD COLUMN position_w FLOAT,
ADD COLUMN position_h FLOAT,
ADD COLUMN rotation FLOAT DEFAULT 0,
ADD COLUMN z_index INTEGER DEFAULT 0;

-- Calculate initial positions from slot data (for existing albums)
UPDATE page_elements pe
SET 
  position_x = CASE 
    WHEN pe.slot_index = 0 THEN 5.0
    WHEN pe.slot_index = 1 THEN 55.0
    ELSE 5.0
  END,
  position_y = CASE 
    WHEN pe.slot_index IN (0, 1) THEN 10.0
    ELSE 50.0
  END,
  position_w = 40.0,
  position_h = 40.0,
  z_index = pe.slot_index
WHERE position_x IS NULL;

COMMIT;
```

---

## 🔄 Backwards Compatibility

Old albums will continue working:
1. When reading: if `position_x` is NULL, calculate from `slot_index`
2. When editing: save new positions, migrate gradually
3. Can always fall back to slot-based view if needed

---

## 🧪 Testing Strategy

1. **Unit tests**: Position calculations, resize logic
2. **Integration tests**: Drag/drop, undo/redo
3. **Manual testing**: Create album, edit elements, verify positioning
4. **Performance**: Test with 20+ elements on single page
5. **Mobile**: Test on iPad/tablet

---

## 📊 Estimated Effort

- Database: 2-3 hours
- Backend (actions): 3-4 hours
- Frontend (component): 5-7 hours
- Testing: 2-3 hours
- Polish: 1-2 hours

**Total: 13-19 hours (~2 days focused work)**

---

## 🎓 Key Technologies

- **React**: Component state management
- **DOM Events**: Mouse events for drag/drop
- **SVG or Canvas**: For rendering draggable elements
- **Undo/Redo**: Custom implementation or library (immer.js)

---

## 🚀 After Phase 4

- Phase 5: Stories rich text editor (3-5 days)
- Phase 6: Mobile polish (5-7 days)
- Phase 7: Admin panel (5-7 days)

**Then: Production launch! 🎉**

---

Generated: 2026-08-19
Next: Start database schema migration
