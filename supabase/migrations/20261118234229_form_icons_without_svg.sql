/*
 * Migration: form icons without svg
 *
 * Purpose:
 *   - form-icons is a public bucket. An SVG file can carry embedded scripts that run when the
 *     file is opened directly from its public URL, so SVG is no longer accepted. Icons are PNG or
 *     WebP only.
 *
 * Affected objects:
 *   - storage.buckets row form-icons: allowed_mime_types
 *
 * Notes:
 *   - files already in the bucket are not touched. When this migration was written the bucket
 *     held a single PNG icon and no SVG.
 *   - the panel only offers PNG and WebP (formIconTypes in packages/shared/src/service-forms.ts).
 */

update storage.buckets
set allowed_mime_types = array['image/png', 'image/webp']
where id = 'form-icons';
