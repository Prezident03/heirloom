/**
 * Migration: Text element styling
 * Adds font size, color, alignment, and font-family choice to text-type page_elements,
 * so the Album Editor's text tool matches Canva-style styling controls.
 */

ALTER TABLE page_elements
ADD COLUMN IF NOT EXISTS text_size INTEGER DEFAULT 22,
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#2E362F',
ADD COLUMN IF NOT EXISTS text_align TEXT DEFAULT 'left',
ADD COLUMN IF NOT EXISTS text_font TEXT DEFAULT 'handwriting';
