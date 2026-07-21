import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';

/**
 * ImageUploadField
 *
 * Props:
 *  - value        {string}   Current image URL (from DB or after upload)
 *  - onChange     {fn}       Called with the new public URL string after upload
 *  - label        {string}   Field label text (default: "Image")
 *  - required     {boolean}  Whether the field is required
 *  - hint         {string}   Optional helper hint below the label
 *  - aspect       {string}   Preview container aspect: "square" | "video" | "banner" (default: square)
 */
export default function ImageUploadField({
  value,
  onChange,
  label = 'Image',
  required = false,
  hint,
  aspect = 'square'
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Preview is either the already-uploaded URL or a local blob
  const [localPreview, setLocalPreview] = useState(null);

  const previewSrc = localPreview || value || null;

  const aspectClasses = {
    square: 'aspect-square max-h-48',
    video: 'aspect-video max-h-48',
    banner: 'aspect-[3/1] max-h-36',
    compact: 'h-14 w-full',
  }[aspect] || 'aspect-square max-h-48';

  const uploadFile = useCallback(async (file) => {
    if (!file) return;

    // Validate client-side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WebP or GIF images are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }

    // Show instant local preview while uploading
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target.result);
    reader.readAsDataURL(file);

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // apiFetch selects the admin token from local or session storage and
      // leaves Content-Type unset so the browser can add the multipart boundary.
      const res = await apiFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploading(false);

      if (data.success) {
        setLocalPreview(null);     // clear local blob; use server URL
        onChange(data.url);
      } else {
        setError(data.message || 'Upload failed.');
        setLocalPreview(null);
      }
    } catch {
      setUploading(false);
      setLocalPreview(null);
      setError('Network error during upload.');
    }
  }, [onChange]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
    // reset input so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    setError('');
    onChange('');
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label */}
      <label className="text-[10px] text-gray-550 font-bold uppercase flex items-center justify-between">
        <span>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</span>
        {hint && <span className="text-[8px] text-gray-405 font-medium normal-case">{hint}</span>}
      </label>

      {previewSrc ? (
        /* ── PREVIEW STATE ── */
        <div className={`relative w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center ${aspect === 'compact' ? 'h-14 px-3 py-1.5' : aspectClasses + ' flex-col justify-center'}`}>
          {aspect === 'compact' ? (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <img loading="lazy" decoding="async"
                  src={previewSrc}
                  alt="Preview"
                  className="w-8 h-8 object-cover rounded border border-gray-200 bg-white"
                />
                <span className="text-[10px] font-semibold text-gray-650 truncate">Image uploaded successfully</span>
              </div>
              {!uploading && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-[9px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="text-[9px] bg-red-50 hover:bg-red-100 text-red-650 font-semibold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <img loading="lazy" decoding="async"
                src={previewSrc}
                alt="Preview"
                className="w-full h-full object-cover absolute inset-0"
              />

              {/* Action bar – appears on hover or always when uploaded */}
              {!uploading && (
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-between bg-black/50 px-2.5 py-1.5 gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-[9px] text-white font-semibold hover:text-gray-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="text-[9px] text-red-300 font-semibold hover:text-red-200 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              )}
            </>
          )}

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        /* ── DROP ZONE / UPLOAD ZONE ── */
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full ${aspect === 'compact' ? 'h-14 flex-row px-4 py-1.5 justify-start' : aspectClasses + ' flex-col justify-center'} border-2 border-dashed rounded-lg flex items-center gap-2 cursor-pointer transition-all select-none
            ${dragging ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'}
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {uploading ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {aspect === 'compact' ? (
                <div className="flex items-center gap-2 w-full text-left">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-gray-600 leading-none">
                      Click/drag to upload logo/image
                    </p>
                    <p className="text-[8px] text-gray-400 mt-0.5">JPEG, PNG, WebP (max 10MB)</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-center px-3">
                    <p className="text-[10px] font-semibold text-gray-600">
                      Click or drag & drop to upload
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">JPEG, PNG, WebP, GIF · max 10 MB</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[9px] text-red-500 font-semibold mt-0.5">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
