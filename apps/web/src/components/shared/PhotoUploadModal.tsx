'use client';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ─── helpers ─── */

/** Convert degrees to radians */
function toRad(deg: number) { return (deg * Math.PI) / 180; }

/** Render the cropped area of the image onto a canvas and return a Blob */
async function getCroppedBlob(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d')!;
  const rad     = toRad(rotation);
  const sin     = Math.abs(Math.sin(rad));
  const cos     = Math.abs(Math.cos(rad));
  const bw      = image.width  * cos + image.height * sin;
  const bh      = image.width  * sin + image.height * cos;

  const offscreen = document.createElement('canvas');
  offscreen.width  = bw;
  offscreen.height = bh;
  const offCtx = offscreen.getContext('2d')!;
  offCtx.translate(bw / 2, bh / 2);
  offCtx.rotate(rad);
  offCtx.drawImage(image, -image.width / 2, -image.height / 2);

  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    offscreen,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas empty')), 'image/jpeg', 0.92);
  });
}

/* ─── types ─── */
interface Photo { id: number; imageUrl: string; isPrimary: boolean; }
interface Props {
  open: boolean;
  onClose: () => void;
  token: string | null;
  currentPhotos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
}

/* ─── aspect ratio options ─── */
const ASPECT_OPTIONS = [
  { label: 'Portrait 3:4', value: 3 / 4 },
  { label: 'Square 1:1',   value: 1 },
  { label: 'Wide 4:3',     value: 4 / 3 },
];

/* ════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════ */
export default function PhotoUploadModal({ open, onClose, token, currentPhotos, onPhotosChange }: Props) {
  /* upload flow state */
  const [step, setStep]               = useState<'gallery' | 'crop' | 'uploading'>('gallery');
  const [rawSrc, setRawSrc]           = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const inputRef                      = useRef<HTMLInputElement>(null);

  /* crop state */
  const [crop, setCrop]               = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom]               = useState(1);
  const [rotation, setRotation]       = useState(0);
  const [aspectIdx, setAspectIdx]     = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  /* reset everything */
  const reset = useCallback(() => {
    setStep('gallery');
    setRawSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectIdx(0);
    setCroppedArea(null);
    setCroppedPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  function handleClose() { reset(); onClose(); }

  /* file picked */
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      setRawSrc(e.target?.result as string);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  }
  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
  }

  /* crop complete callback */
  function onCropComplete(_: Area, pixels: Area) { setCroppedArea(pixels); }

  /* generate cropped preview */
  async function applyCrop() {
    if (!rawSrc || !croppedArea) return;
    try {
      const blob = await getCroppedBlob(rawSrc, croppedArea, rotation);
      setCroppedPreview(URL.createObjectURL(blob));
      setStep('uploading');
    } catch { toast.error('Could not process image'); }
  }

  /* upload */
  async function handleUpload() {
    if (!rawSrc || !croppedArea || !token) return;
    setStep('uploading');
    try {
      const blob     = await getCroppedBlob(rawSrc, croppedArea, rotation);
      const file     = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('photo', file);

      const res  = await fetch(`${API_URL}/api/upload/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      onPhotosChange([...currentPhotos, data.photo]);
      toast.success('Photo uploaded!');
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setStep('crop');
    }
  }

  /* photo actions */
  async function handleSetPrimary(photoId: number) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/upload/profile-photo/${photoId}/primary`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      onPhotosChange(currentPhotos.map(p => ({ ...p, isPrimary: p.id === photoId })));
      toast.success('Main photo updated');
    } catch { toast.error('Could not update main photo'); }
  }

  async function handleDelete(photoId: number) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/upload/profile-photo/${photoId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated = currentPhotos.filter(p => p.id !== photoId);
      if (currentPhotos.find(p => p.id === photoId)?.isPrimary && updated.length > 0) {
        updated[0] = { ...updated[0], isPrimary: true };
      }
      onPhotosChange(updated);
      toast.success('Photo deleted');
    } catch { toast.error('Could not delete photo'); }
  }

  const aspect = ASPECT_OPTIONS[aspectIdx].value;

  /* ── RENDER ── */
  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="bg-white rounded-3xl shadow-2xl w-full flex flex-col"
          style={{ maxWidth: step === 'crop' ? 680 : 520, maxHeight: '92vh' }}
        >

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0E4D0] flex-shrink-0">
            <div className="flex items-center gap-3">
              {step !== 'gallery' && (
                <button
                  onClick={() => { setCroppedPreview(null); setStep(step === 'uploading' ? 'crop' : 'gallery'); if (step === 'crop') { setRawSrc(null); reset(); } }}
                  className="w-7 h-7 rounded-full bg-[#F5F0EB] flex items-center justify-center text-[#7A6A5A] hover:bg-[#F0E4D0] transition-colors cursor-pointer border-none text-base"
                >
                  ‹
                </button>
              )}
              <h2 className="font-bold text-[#2A1A1A] text-base" style={{ fontFamily: "'Playfair Display',serif" }}>
                {step === 'gallery'   && 'Profile Photos'}
                {step === 'crop'      && 'Crop & Adjust'}
                {step === 'uploading' && 'Preview & Upload'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-[#F5F0EB] flex items-center justify-center text-[#7A6A5A] hover:bg-[#F0E4D0] transition-colors cursor-pointer border-none text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* ══════════════════════════════════
              STEP 1 — GALLERY + DROP ZONE
          ══════════════════════════════════ */}
          {step === 'gallery' && (
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* existing photos */}
              {currentPhotos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#7A6A5A] uppercase tracking-wide mb-3">Your Photos</p>
                  <div className="grid grid-cols-3 gap-3">
                    {currentPhotos.map(photo => (
                      <div key={photo.id} className="relative group rounded-2xl overflow-hidden aspect-square border-2 border-transparent hover:border-[#F4A435] transition-all">
                        <img src={photo.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                        {photo.isPrimary && (
                          <div className="absolute top-1.5 left-1.5 bg-[#F4A435] text-white text-[9px] font-bold rounded-full px-2 py-0.5">Main</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          {!photo.isPrimary && (
                            <button onClick={() => handleSetPrimary(photo.id)} className="bg-white text-[#2A1A1A] text-[10px] font-bold rounded-full px-3 py-1 cursor-pointer border-none hover:bg-[#FFF3E0] transition-colors">
                              Set Main
                            </button>
                          )}
                          <button onClick={() => handleDelete(photo.id)} className="bg-red-500 text-white text-[10px] font-bold rounded-full px-3 py-1 cursor-pointer border-none hover:bg-red-600 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* drop zone */}
              <div>
                <p className="text-xs font-semibold text-[#7A6A5A] uppercase tracking-wide mb-3">
                  {currentPhotos.length > 0 ? 'Add Another Photo' : 'Upload Your Photo'}
                </p>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    dragOver ? 'border-[#F4A435] bg-[#FFF3E0]' : 'border-[#D0C0B0] bg-[#FFFBF7] hover:border-[#F4A435] hover:bg-[#FFF8F2]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-[#FFF3E0] flex items-center justify-center text-2xl border border-[#F4A435]/30">📷</div>
                  <div className="text-center">
                    <p className="font-semibold text-[#2A1A1A] text-sm mb-1">{dragOver ? 'Drop your photo here' : 'Click or drag photo here'}</p>
                    <p className="text-xs text-[#9A8A7A]">JPG, PNG or WEBP · Max 10 MB</p>
                  </div>
                  <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
                </div>
              </div>

              {/* tips */}
              <div className="bg-[#FFFBF7] rounded-2xl p-4 border border-[#F0E4D0]">
                <p className="text-xs font-semibold text-[#5A4A3A] mb-2">Photo Tips</p>
                <ul className="text-xs text-[#7A6A5A] space-y-1">
                  <li>✅ Clear face photo in good lighting</li>
                  <li>✅ Formal or semi-formal attire preferred</li>
                  <li>❌ No group photos or sunglasses</li>
                </ul>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              STEP 2 — CROP / ZOOM / ROTATE
          ══════════════════════════════════ */}
          {step === 'crop' && rawSrc && (
            <div className="flex flex-col flex-1 overflow-hidden">

              {/* cropper canvas */}
              <div className="relative flex-1 bg-[#1C0E08]" style={{ minHeight: 340 }}>
                <Cropper
                  image={rawSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: { borderRadius: 0 },
                    cropAreaStyle: { border: '2px solid #F4A435', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' },
                  }}
                />
              </div>

              {/* controls */}
              <div className="flex-shrink-0 px-6 py-4 space-y-4 border-t border-[#F0E4D0]">

                {/* aspect ratio pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#7A6A5A] w-16 flex-shrink-0">Ratio</span>
                  <div className="flex gap-2 flex-wrap">
                    {ASPECT_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.label}
                        onClick={() => setAspectIdx(i)}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border cursor-pointer transition-all ${
                          aspectIdx === i
                            ? 'bg-[#F4A435] text-white border-[#F4A435]'
                            : 'bg-white text-[#5A4A3A] border-[#D0C0B0] hover:border-[#F4A435]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* zoom slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#7A6A5A] w-16 flex-shrink-0">Zoom</span>
                  <span className="text-sm">🔍</span>
                  <input
                    type="range"
                    min={1} max={3} step={0.01}
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-full accent-[#F4A435] cursor-pointer"
                  />
                  <span className="text-xs text-[#9A8A7A] w-10 text-right">{zoom.toFixed(1)}×</span>
                </div>

                {/* rotation slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#7A6A5A] w-16 flex-shrink-0">Rotate</span>
                  <span className="text-sm">↻</span>
                  <input
                    type="range"
                    min={-180} max={180} step={1}
                    value={rotation}
                    onChange={e => setRotation(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-full accent-[#F4A435] cursor-pointer"
                  />
                  <span className="text-xs text-[#9A8A7A] w-10 text-right">{rotation}°</span>
                </div>

                {/* reset + apply */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-[#5A4A3A] bg-[#F5F0EB] border-none cursor-pointer hover:bg-[#F0E4D0] transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyCrop}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}
                  >
                    Apply Crop →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              STEP 3 — PREVIEW & UPLOAD
          ══════════════════════════════════ */}
          {step === 'uploading' && croppedPreview && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-xs font-semibold text-[#7A6A5A] uppercase tracking-wide">Cropped Preview</p>

              <div className="rounded-2xl overflow-hidden border-2 border-[#F4A435] mx-auto" style={{ maxWidth: 300 }}>
                <img src={croppedPreview} alt="Cropped preview" className="w-full object-cover" />
              </div>

              <p className="text-xs text-[#9A8A7A] text-center">
                This is exactly how your photo will appear on your profile.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { setCroppedPreview(null); setStep('crop'); }}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-[#5A4A3A] bg-[#F5F0EB] border-none cursor-pointer hover:bg-[#F0E4D0] transition-colors"
                >
                  ← Re-crop
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
                  </svg>
                  Upload Photo
                </button>
              </div>
            </div>
          )}

        </DialogPanel>
      </div>
    </Dialog>
  );
}
