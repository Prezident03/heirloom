/**
 * Migration: Sticker / Frame / Background support for the album editor
 * - album_pages.background_id: which paper/background swatch a page uses
 * - page_elements.frame_style: photo frame treatment (polaroid / soft / none)
 * - page_elements.sticker_id: which decorative sticker a "sticker" type element renders
 */

ALTER TABLE album_pages
ADD COLUMN IF NOT EXISTS background_id TEXT DEFAULT 'paper';

ALTER TABLE page_elements
ADD COLUMN IF NOT EXISTS frame_style TEXT DEFAULT 'polaroid',
ADD COLUMN IF NOT EXISTS sticker_id TEXT;
