import React, { useState, useRef } from 'react';
import { ProgressPhoto, PhotoCategory, MeasurementEntry } from '../../domain/types';
import { MAX_PHOTO_BYTES } from '../../db/repositories';
import { usePhotoUrl } from './usePhotoUrl';
import { CornerPanel } from '../../components/ui/CornerPanel';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { SystemModal } from '../../components/ui/SystemModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { MetricBadge } from '../../components/ui/MetricBadge';
import {
  Upload,
  Trash2,
  Columns,
  ZoomIn,
  X,
  Lock,
} from 'lucide-react';

interface PhotosModuleProps {
  photos: ProgressPhoto[];
  measurements: MeasurementEntry[];
  onUploadPhoto: (
    photo: Omit<ProgressPhoto, 'id' | 'createdAt'>
  ) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
}

// Child component for rendering single thumbnail with managed URL lifecycle
const PhotoCard: React.FC<{
  photo: ProgressPhoto;
  onSelectCompare: () => void;
  onDelete: () => void;
  onZoom: () => void;
  isCompareA: boolean;
  isCompareB: boolean;
}> = ({ photo, onSelectCompare, onDelete, onZoom, isCompareA, isCompareB }) => {
  const imageUrl = usePhotoUrl(photo.blob);

  return (
    <div
      className={`group relative border rounded-sm overflow-hidden bg-obsidian-void transition-all duration-150 ${
        isCompareA
          ? 'border-solo-blue ring-1 ring-solo-blue'
          : isCompareB
          ? 'border-combat-crimson ring-1 ring-combat-crimson'
          : 'border-tactical-border hover:border-solo-blue/60'
      }`}
    >
      <div className="aspect-[3/4] w-full bg-obsidian-charcoal overflow-hidden flex items-center justify-center relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${photo.category} - ${photo.date}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-[10px] font-mono text-ayanokoji-muted">LOADING BLOB...</div>
        )}

        {/* Hover overlay with action triggers */}
        <div className="absolute inset-0 bg-obsidian-void/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          <div className="flex justify-between items-center">
            <MetricBadge label={photo.category} variant="blue" size="sm" />
            <div className="flex items-center gap-1">
              <button
                onClick={onZoom}
                className="p-1.5 bg-obsidian-elevated/90 text-ayanokoji-slate hover:text-white rounded-sm border border-tactical-border"
                title="Zoom Photo"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 bg-obsidian-elevated/90 text-ayanokoji-muted hover:text-combat-crimson rounded-sm border border-tactical-border"
                title="Delete Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={onSelectCompare}
              className="w-full py-1.5 px-2 bg-solo-blue/20 hover:bg-solo-blue/30 border border-solo-blue text-solo-blue text-[10px] font-mono font-bold uppercase rounded-sm"
            >
              {isCompareA ? 'SELECTED AS A' : isCompareB ? 'SELECTED AS B' : 'SELECT FOR COMPARISON'}
            </button>
          </div>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="p-2.5 bg-obsidian-charcoal border-t border-tactical-border flex items-center justify-between text-xs font-mono">
        <span className="font-semibold text-white">{photo.date}</span>
        <span className="text-[10px] text-ayanokoji-muted uppercase">{photo.category}</span>
      </div>
    </div>
  );
};

// Child component for side-by-side comparison pane
const SplitViewPane: React.FC<{
  photo: ProgressPhoto;
  label: 'SLOT A (BASELINE)' | 'SLOT B (PROGRESSION)';
  measurements: MeasurementEntry[];
  borderColor: 'blue' | 'crimson';
  onClear: () => void;
}> = ({ photo, label, measurements, borderColor, onClear }) => {
  const imageUrl = usePhotoUrl(photo.blob);

  // Find matching measurement on same date, or nearest
  const matchMeasurement = measurements.find((m) => m.date === photo.date);

  return (
    <div
      className={`border rounded-sm bg-obsidian-charcoal p-3 space-y-2 relative ${
        borderColor === 'blue' ? 'border-solo-blue/60' : 'border-combat-crimson/60'
      }`}
    >
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2">
        <span
          className={`text-xs font-mono font-bold uppercase ${
            borderColor === 'blue' ? 'text-solo-blue' : 'text-combat-crimson'
          }`}
        >
          {label}
        </span>
        <button
          onClick={onClear}
          className="text-ayanokoji-muted hover:text-white p-1"
          title="Clear Slot"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="aspect-[3/4] bg-obsidian-void rounded-sm overflow-hidden flex items-center justify-center relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-xs font-mono text-ayanokoji-muted">Loading...</div>
        )}

        {/* Date & Pose Overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-obsidian-charcoal/90 backdrop-blur-sm border border-tactical-border p-2 rounded-sm text-xs font-mono">
          <div className="flex justify-between items-center text-white font-semibold">
            <span>{photo.date}</span>
            <span className="uppercase text-[10px] text-solo-blue">{photo.category}</span>
          </div>
          {matchMeasurement?.bodyweightKg !== undefined && (
            <div className="text-[10px] text-ayanokoji-muted mt-0.5">
              Weight: {matchMeasurement.bodyweightKg.toFixed(1)} kg
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PhotosModule: React.FC<PhotosModuleProps> = ({
  photos,
  measurements,
  onUploadPhoto,
  onDeletePhoto,
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [compareIdA, setCompareIdA] = useState<string | null>(photos[1]?.id || null);
  const [compareIdB, setCompareIdB] = useState<string | null>(photos[0]?.id || null);
  const [isComparing, setIsComparing] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<ProgressPhoto | null>(null);

  // Upload Form states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('Front');
  const [customCategory, setCustomCategory] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Deletion confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      setUploadError('Image size exceeds 15MB limit.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('Unsupported format. Only JPG, PNG, and WEBP images are supported.');
      return;
    }

    setUploadFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Select an image file to proceed.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const finalCategory =
        uploadCategory === 'custom' && customCategory.trim()
          ? customCategory.trim()
          : uploadCategory;

      await onUploadPhoto({
        date: uploadDate,
        category: finalCategory,
        blob: uploadFile,
        mimeType: uploadFile.type,
        fileSize: uploadFile.size,
        notes: uploadNotes.trim() || undefined,
      });

      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadNotes('');
      setCustomCategory('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectCompare = (photoId: string) => {
    if (!compareIdA) {
      setCompareIdA(photoId);
      setIsComparing(true);
    } else if (!compareIdB && photoId !== compareIdA) {
      setCompareIdB(photoId);
      setIsComparing(true);
    } else {
      // Rotate: replace B with new photo
      setCompareIdB(photoId);
      setIsComparing(true);
    }
  };

  // Filter photos
  const filteredPhotos = photos.filter((p) => {
    if (selectedCategoryFilter === 'all') return true;
    return p.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
  });

  const photoA = photos.find((p) => p.id === compareIdA);
  const photoB = photos.find((p) => p.id === compareIdB);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tactical-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide uppercase">
              MODULE D // PRIVATE PROGRESS VAULT
            </h2>
            <MetricBadge label="OFFLINE LOCAL" variant="blue" icon={Lock} />
          </div>
          <p className="text-xs text-ayanokoji-muted font-mono mt-0.5">
            Client-side biometric photography stored directly in IndexedDB. Zero telemetry leaves this machine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {photos.length >= 2 && (
            <TacticalButton
              variant="secondary"
              size="md"
              icon={Columns}
              onClick={() => setIsComparing(!isComparing)}
            >
              {isComparing ? 'HIDE COMPARATOR' : 'SPLIT COMPARATOR'}
            </TacticalButton>
          )}
          <TacticalButton
            variant="primary"
            size="md"
            icon={Upload}
            onClick={() => setIsUploadOpen(true)}
          >
            IMPORT PHOTO
          </TacticalButton>
        </div>
      </div>

      {/* Explicit Privacy Notice Banner */}
      <div className="flex items-start gap-3 bg-obsidian-charcoal border border-solo-blue/40 p-3.5 rounded-sm shadow-hud-blue">
        <Lock className="w-5 h-5 text-solo-blue shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white">
            CLIENT-SIDE BIOMETRIC ISOLATION ARCHITECTURE
          </h4>
          <p className="text-[11px] font-mono text-ayanokoji-secondary leading-relaxed">
            All visual physique documentation is stored as binary Blobs directly inside your local browser IndexedDB storage. No photographs are ever transmitted to any remote server or third-party cloud. Clearing your browser site data or clearing cache will erase these files unless exported via the System Config (Module G) backup engine.
          </p>
        </div>
      </div>

      {/* SIDE-BY-SIDE SPLIT VIEW COMPARATOR */}
      {isComparing && (
        <CornerPanel
          variant="blue"
          title="Side-by-Side Visual Comparator"
          subtitle="Direct visual progress delta inspection"
          icon={Columns}
          action={
            <TacticalButton
              variant="ghost"
              size="sm"
              onClick={() => setIsComparing(false)}
            >
              CLOSE
            </TacticalButton>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photoA ? (
              <SplitViewPane
                photo={photoA}
                label="SLOT A (BASELINE)"
                measurements={measurements}
                borderColor="blue"
                onClear={() => setCompareIdA(null)}
              />
            ) : (
              <div className="border border-dashed border-tactical-border rounded-sm aspect-[3/4] flex flex-col items-center justify-center p-4 text-center">
                <p className="text-xs font-mono text-ayanokoji-muted mb-2">
                  Select a photo from the gallery below to anchor into Slot A.
                </p>
              </div>
            )}

            {photoB ? (
              <SplitViewPane
                photo={photoB}
                label="SLOT B (PROGRESSION)"
                measurements={measurements}
                borderColor="crimson"
                onClear={() => setCompareIdB(null)}
              />
            ) : (
              <div className="border border-dashed border-tactical-border rounded-sm aspect-[3/4] flex flex-col items-center justify-center p-4 text-center">
                <p className="text-xs font-mono text-ayanokoji-muted mb-2">
                  Select a second photo from the gallery below to anchor into Slot B.
                </p>
              </div>
            )}
          </div>
        </CornerPanel>
      )}

      {/* FILTER & GALLERY GRID */}
      <div className="space-y-4">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-obsidian-charcoal p-3 border border-tactical-border rounded-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'Front', 'Side', 'Back', 'Front Double Biceps'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors border ${
                  selectedCategoryFilter === cat
                    ? 'border-solo-blue bg-solo-blue/20 text-white font-bold'
                    : 'border-tactical-border bg-obsidian-void text-ayanokoji-muted hover:text-white'
                }`}
              >
                {cat === 'all' ? 'ALL POSES' : cat}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-ayanokoji-muted">
            {filteredPhotos.length} OF {photos.length} PHOTOS
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onSelectCompare={() => handleSelectCompare(photo.id)}
                onDelete={() => setDeleteId(photo.id)}
                onZoom={() => setZoomedPhoto(photo)}
                isCompareA={compareIdA === photo.id}
                isCompareB={compareIdB === photo.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="NO PHOTO RECORDS IN VAULT"
            description="Document your physical evolution with uncompressed private photos stored strictly inside your browser."
            actionLabel="IMPORT FIRST PHOTO"
            onAction={() => setIsUploadOpen(true)}
            actionVariant="primary"
          />
        )}
      </div>

      {/* UPLOAD MODAL */}
      <SystemModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="IMPORT PHOTO TO PRIVATE VAULT"
        subtitle="Max 15MB // JPG, PNG, WEBP // Stored in IndexedDB"
        variant="blue"
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-red-950/40 border border-red-700/60 rounded-sm text-xs font-mono text-red-300">
              {uploadError}
            </div>
          )}

          {/* File input */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-tactical-border hover:border-solo-blue p-6 rounded-sm text-center cursor-pointer bg-obsidian-void/60 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-solo-blue mx-auto mb-2" />
            <p className="text-xs font-display font-semibold text-white uppercase">
              {uploadFile ? uploadFile.name : 'CLICK TO SELECT PHOTO FROM DEVICE'}
            </p>
            <p className="text-[10px] font-mono text-ayanokoji-muted mt-1">
              {uploadFile
                ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`
                : 'JPG, PNG, or WEBP up to 15MB'}
            </p>
          </div>

          {/* Date & Pose Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Photo Date
              </label>
              <input
                type="date"
                required
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Standard Pose
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as PhotoCategory)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              >
                <option value="Front">Front</option>
                <option value="Side">Side</option>
                <option value="Back">Back</option>
                <option value="Front Double Biceps">Front Double Biceps</option>
                <option value="custom">Custom Tag...</option>
              </select>
            </div>
          </div>

          {uploadCategory === 'custom' && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Custom Tag Name
              </label>
              <input
                type="text"
                placeholder="e.g. Most Muscular, Lat Spread"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
              Lighting / Fasting Notes
            </label>
            <textarea
              rows={2}
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="Morning lighting check, unpumped..."
              className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-tactical-border">
            <TacticalButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
              disabled={isUploading}
            >
              CANCEL
            </TacticalButton>
            <TacticalButton
              type="submit"
              variant="primary"
              size="md"
              loading={isUploading}
            >
              SAVE TO VAULT
            </TacticalButton>
          </div>
        </form>
      </SystemModal>

      {/* PHOTO ZOOM MODAL */}
      {zoomedPhoto && (
        <SystemModal
          isOpen={true}
          onClose={() => setZoomedPhoto(null)}
          title={`VAULT INSPECT // ${zoomedPhoto.date} (${zoomedPhoto.category})`}
          maxWidth="2xl"
          variant="blue"
        >
          <div className="space-y-3">
            <div className="max-h-[70vh] flex items-center justify-center bg-obsidian-void rounded-sm overflow-hidden">
              <ZoomedImage blob={zoomedPhoto.blob} />
            </div>
            {zoomedPhoto.notes && (
              <p className="text-xs font-mono text-ayanokoji-secondary italic">
                "{zoomedPhoto.notes}"
              </p>
            )}
          </div>
        </SystemModal>
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await onDeletePhoto(deleteId);
            setDeleteId(null);
          }
        }}
        title="DELETE PHOTO PERMANENTLY"
        message="Are you certain you wish to purge this visual record from your browser IndexedDB vault? This operation is irreversible."
      />
    </div>
  );
};

// Helper component for Zoomed image using lifecycle hook
const ZoomedImage: React.FC<{ blob: Blob }> = ({ blob }) => {
  const url = usePhotoUrl(blob);
  if (!url) return <div className="p-8 text-xs font-mono text-ayanokoji-muted">Loading...</div>;
  return <img src={url} alt="Zoomed inspection" className="max-h-[65vh] object-contain w-auto" />;
};
