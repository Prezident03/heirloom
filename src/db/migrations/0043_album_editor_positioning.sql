/**
 * Migration: Add positioning columns to page_elements
 * Enables free-form drag-drop editor instead of slot-based layouts
 */

-- Add new positioning columns
ALTER TABLE page_elements
ADD COLUMN IF NOT EXISTS position_x FLOAT,
ADD COLUMN IF NOT EXISTS position_y FLOAT,
ADD COLUMN IF NOT EXISTS position_w FLOAT,
ADD COLUMN IF NOT EXISTS position_h FLOAT,
ADD COLUMN IF NOT EXISTS rotation FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 0;

-- Migrate existing slot-based data to new positioning
-- This creates reasonable default positions for existing albums
UPDATE page_elements
SET
  position_x = CASE
    WHEN slot_index = 0 THEN 5.0
    WHEN slot_index = 1 THEN 55.0
    WHEN slot_index = 2 THEN 5.0
    WHEN slot_index = 3 THEN 55.0
    ELSE 5.0
  END,
  position_y = CASE
    WHEN slot_index IN (0, 1) THEN 10.0
    WHEN slot_index IN (2, 3) THEN 50.0
    ELSE 10.0
  END,
  position_w = 40.0,
  position_h = 40.0,
  z_index = slot_index
WHERE position_x IS NULL AND slot_index IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_elements_positioning
ON page_elements(page_id, z_index, position_x);
