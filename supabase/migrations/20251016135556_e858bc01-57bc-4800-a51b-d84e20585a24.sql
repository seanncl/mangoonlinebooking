-- Add photo_url and bio columns to staff table
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN public.staff.photo_url IS 'URL or path to staff member photo';
COMMENT ON COLUMN public.staff.bio IS 'Short biography or description of staff member';