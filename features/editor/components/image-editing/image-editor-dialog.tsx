"use client";

import { RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ColorPickerControl } from "@/components/ui/color-picker-control";
import type { RenderNode } from "@/features/editor/schema/render-tree";
import { ImageCropManipulator } from "./image-crop-manipulator";
import type {
  ImageEditingState,
  ImageEditorTab,
  ImageFilterPreset,
  ImageMaskBounds,
  ImageMaskType,
} from "./image-editor-types";
import {
  buildImageCssFilter,
  buildImageMaskPathData,
  defaultImageEditingState,
  normalizeImageEditingState,
  resolveImageMaskBorderPresentation,
  resolveImageMaskFrame,
  resolveImagePreviewSource,
  resolveImagePreviewSvgGeometry,
} from "./image-editor-utils";
import { ImageMaskManipulator } from "./image-mask-manipulator";

type ImageEditorDialogProps = {
  node: RenderNode;
  onApply: (editing: ImageEditingState) => void;
  onCancel: () => void;
};

const tabs: Array<{ id: ImageEditorTab; label: string }> = [
  { id: "crop", label: "Recadrer" },
  { id: "mask", label: "Masque" },
  { id: "filters", label: "Filtres" },
  { id: "adjustments", label: "Réglages" },
  { id: "effects", label: "Effets" },
  { id: "transform", label: "Transformer" },
];

const filterOptions: Array<{ id: ImageFilterPreset; label: string }> = [
  { id: "none", label: "Aucun" },
  { id: "grayscale", label: "Noir et blanc" },
  { id: "sepia", label: "Sépia" },
  { id: "vintage", label: "Vintage" },
  { id: "cool", label: "Froid" },
  { id: "warm", label: "Chaud" },
  { id: "high-contrast", label: "Contraste fort" },
  { id: "soft", label: "Doux" },
  { id: "bright", label: "Lumineux" },
  { id: "dark", label: "Sombre" },
];

const maskOptions: Array<{ id: ImageMaskType; label: string }> = [
  { id: "rectangle", label: "Rectangle" },
  { id: "rounded-rect", label: "Arrondi" },
  { id: "circle", label: "Cercle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "diamond", label: "Losange" },
  { id: "star", label: "Étoile" },
  { id: "blob", label: "Blob" },
];

const maskBorderStyleOptions: Array<{
  id: ImageEditingState["mask"]["border"]["style"];
  label: string;
}> = [
  { id: "solid", label: "Solid" },
  { id: "dashed", label: "Dashed" },
  { id: "dashed-round", label: "Dashed Round" },
  { id: "long-dashed", label: "Long Dashed" },
  { id: "long-dashed-round", label: "Long Dashed Round" },
  { id: "dotted", label: "Dotted" },
];

export function ImageEditorDialog({ node, onApply, onCancel }: ImageEditorDialogProps) {
  const initialEditing = useMemo(
    () => normalizeImageEditingState(node.props.imageEditing),
    [node.props.imageEditing],
  );
  const [activeTab, setActiveTab] = useState<ImageEditorTab>("crop");
  const [draft, setDraft] = useState<ImageEditingState>(initialEditing);
  const source = useMemo(() => resolveImagePreviewSource(node.props.src), [node.props.src]);
  const previewClipId = useMemo(() => `ef-image-editor-preview-clip-${node.id}`, [node.id]);
  const previewFrameWidth =
    Number.isFinite(node.frame.width) && node.frame.width > 0 ? node.frame.width : 1;
  const previewFrameHeight =
    Number.isFinite(node.frame.height) && node.frame.height > 0 ? node.frame.height : 1;
  const previewAspectRatio = useMemo(
    () => `${previewFrameWidth} / ${previewFrameHeight}`,
    [previewFrameHeight, previewFrameWidth],
  );
  const previewSvgGeometry = useMemo(
    () => resolveImagePreviewSvgGeometry(draft, previewFrameWidth, previewFrameHeight),
    [draft, previewFrameHeight, previewFrameWidth],
  );
  const maskFrame = useMemo(
    () => resolveImageMaskFrame(draft.mask.bounds, previewFrameWidth, previewFrameHeight),
    [draft.mask.bounds, previewFrameHeight, previewFrameWidth],
  );
  const maskBorderPresentation = useMemo(
    () => resolveImageMaskBorderPresentation(draft.mask.border),
    [draft.mask.border],
  );
  const maskPathData = useMemo(
    () =>
      buildImageMaskPathData(
        maskFrame,
        draft.mask.type,
        draft.mask.type === "rounded-rect" ? draft.mask.radius : 0,
      ),
    [draft.mask.radius, draft.mask.type, maskFrame],
  );
  const hasSource = source.length > 0;
  const handleCropChange = useCallback((crop: ImageEditingState["crop"]) => {
    setDraft((current) => ({
      ...current,
      crop,
    }));
  }, []);
  const handleMaskBoundsChange = useCallback((bounds: ImageMaskBounds) => {
    setDraft((current) => ({
      ...current,
      mask: {
        ...current.mask,
        bounds,
      },
    }));
  }, []);
  const handleReset = useCallback(() => {
    setDraft(structuredClone(defaultImageEditingState));
    setActiveTab("crop");
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- reset local editing state when target node changes */
  useEffect(() => {
    setDraft(initialEditing);
    setActiveTab("crop");
  }, [node.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="ef-image-editor-backdrop"
      role="dialog"
      aria-label="Éditeur d’image"
      aria-modal="true"
    >
      <div className="ef-image-editor-dialog">
        <header className="ef-image-editor-header">
          <div>
            <strong>Éditer l’image</strong>
            <span>{node.id}</span>
          </div>
          <button
            type="button"
            className="ef-image-editor-icon-button"
            onClick={onCancel}
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="ef-image-editor-body">
          <nav className="ef-image-editor-tabs" aria-label="Outils image">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "is-active" : ""}
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <section className="ef-image-editor-panel">
            {activeTab === "crop" ? <CropPanel draft={draft} setDraft={setDraft} /> : null}
            {activeTab === "mask" ? <MaskPanel draft={draft} setDraft={setDraft} /> : null}
            {activeTab === "filters" ? <FiltersPanel draft={draft} setDraft={setDraft} /> : null}
            {activeTab === "adjustments" ? (
              <AdjustmentsPanel draft={draft} setDraft={setDraft} />
            ) : null}
            {activeTab === "effects" ? <EffectsPanel draft={draft} setDraft={setDraft} /> : null}
            {activeTab === "transform" ? (
              <TransformPanel draft={draft} setDraft={setDraft} />
            ) : null}
          </section>

          <section className="ef-image-editor-preview">
            <div
              className="ef-image-editor-preview-frame"
              style={{ aspectRatio: previewAspectRatio }}
            >
              {hasSource ? (
                <svg
                  className="ef-image-editor-preview-svg"
                  viewBox={`0 0 ${previewFrameWidth} ${previewFrameHeight}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <clipPath id={previewClipId}>
                      <path d={maskPathData} />
                    </clipPath>
                  </defs>
                  <g
                    clipPath={`url(#${previewClipId})`}
                    opacity={draft.adjustments.opacity}
                    style={{ filter: buildImageCssFilter(draft) }}
                    transform={`translate(${previewFrameWidth / 2} ${previewFrameHeight / 2}) scale(${previewSvgGeometry.flipX ? -1 : 1} ${previewSvgGeometry.flipY ? -1 : 1}) rotate(${previewSvgGeometry.rotation}) translate(${-previewFrameWidth / 2} ${-previewFrameHeight / 2})`}
                  >
                    <image
                      href={source}
                      x={previewSvgGeometry.x}
                      y={previewSvgGeometry.y}
                      width={previewSvgGeometry.width}
                      height={previewSvgGeometry.height}
                      preserveAspectRatio="none"
                    />
                  </g>
                  {draft.mask.border.width > 0 ? (
                    <path
                      d={maskPathData}
                      fill="none"
                      stroke={draft.mask.border.color}
                      strokeWidth={draft.mask.border.width}
                      strokeDasharray={
                        maskBorderPresentation.dash.length > 0
                          ? maskBorderPresentation.dash.join(" ")
                          : undefined
                      }
                      strokeLinecap={maskBorderPresentation.lineCap}
                      strokeLinejoin={maskBorderPresentation.lineJoin}
                      vectorEffect="non-scaling-stroke"
                      style={{
                        filter:
                          draft.mask.border.shadow > 0
                            ? `drop-shadow(0 0 ${Math.max(1, draft.mask.border.shadow * 9).toFixed(2)}px rgba(0, 0, 0, 0.55))`
                            : undefined,
                      }}
                    />
                  ) : null}
                </svg>
              ) : (
                <span className="ef-image-editor-preview-empty">
                  {typeof node.props.src === "string" && node.props.src.trim()
                    ? "Source image invalide"
                    : "Aucune image"}
                </span>
              )}
              {draft.adjustments.vignette > 0 ? (
                <div
                  className="ef-image-editor-vignette"
                  style={{ opacity: draft.adjustments.vignette }}
                />
              ) : null}
              {draft.adjustments.grain > 0 ? (
                <div
                  className="ef-image-editor-grain"
                  style={{ opacity: draft.adjustments.grain }}
                />
              ) : null}
              {(activeTab === "crop" || activeTab === "mask") && hasSource ? (
                <ImageCropManipulator editing={draft} onChange={handleCropChange} />
              ) : null}
              {activeTab === "mask" && hasSource ? (
                <ImageMaskManipulator editing={draft} onChange={handleMaskBoundsChange} />
              ) : null}
            </div>
          </section>
        </div>

        <footer className="ef-image-editor-footer">
          <button type="button" className="ef-image-editor-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="ef-image-editor-secondary" onClick={handleReset}>
            <RotateCcw size={14} aria-hidden="true" />
            Réinitialiser
          </button>
          <button
            type="button"
            className="ef-image-editor-primary"
            onClick={() => onApply(draft)}
            disabled={!hasSource}
            title={hasSource ? "Appliquer" : "L'image source est invalide"}
          >
            Appliquer
          </button>
        </footer>
      </div>
    </div>
  );
}

function CropPanel({ draft, setDraft }: PanelProps) {
  return (
    <>
      <ControlSelect
        label="Ratio"
        value={draft.crop.ratio}
        onChange={(ratio) =>
          setDraft({
            ...draft,
            crop: { ...draft.crop, ratio: ratio as ImageEditingState["crop"]["ratio"] },
          })
        }
        options={["free", "1:1", "4:3", "3:4", "16:9", "9:16", "block"]}
      />
      <ControlSlider
        label="Zoom image"
        min={0.25}
        max={5}
        step={0.05}
        value={draft.crop.zoom}
        onChange={(zoom) => setDraft({ ...draft, crop: { ...draft.crop, zoom } })}
      />
      <ControlSlider
        label="Déplacement X"
        min={-1}
        max={1}
        step={0.01}
        value={draft.crop.x}
        onChange={(x) => setDraft({ ...draft, crop: { ...draft.crop, x } })}
      />
      <ControlSlider
        label="Déplacement Y"
        min={-1}
        max={1}
        step={0.01}
        value={draft.crop.y}
        onChange={(y) => setDraft({ ...draft, crop: { ...draft.crop, y } })}
      />
      <ControlSlider
        label="Rotation crop"
        min={-180}
        max={180}
        step={1}
        value={draft.crop.rotation}
        onChange={(rotation) => setDraft({ ...draft, crop: { ...draft.crop, rotation } })}
      />
      <p className="ef-image-editor-hint">
        Glissez l’image dans l’aperçu pour la déplacer. Utilisez les coins pour ajuster le zoom.
      </p>
    </>
  );
}

function MaskPanel({ draft, setDraft }: PanelProps) {
  const handleBorderChange = useCallback(
    (patch: Partial<ImageEditingState["mask"]["border"]>) => {
      setDraft({
        ...draft,
        mask: {
          ...draft.mask,
          border: {
            ...draft.mask.border,
            ...patch,
          },
        },
      });
    },
    [draft, setDraft],
  );

  return (
    <>
      <div className="ef-image-editor-choice-grid">
        {maskOptions.map((mask) => (
          <button
            key={mask.id}
            type="button"
            className={draft.mask.type === mask.id ? "is-active" : ""}
            onClick={() => setDraft({ ...draft, mask: { ...draft.mask, type: mask.id } })}
          >
            {mask.label}
          </button>
        ))}
      </div>
      <ControlSlider
        label="Rayon"
        min={0}
        max={80}
        step={1}
        value={draft.mask.radius}
        onChange={(radius) => setDraft({ ...draft, mask: { ...draft.mask, radius } })}
      />
      <div className="ef-image-editor-subsection">
        <span className="ef-image-editor-section-title">Contour</span>
        <ControlSlider
          label="Epaisseur contour"
          min={0}
          max={24}
          step={1}
          value={draft.mask.border.width}
          onChange={(width) => handleBorderChange({ width })}
        />
        <ControlColor
          label="Couleur contour"
          value={draft.mask.border.color}
          onChange={(color) => handleBorderChange({ color })}
        />
        <div className="ef-image-editor-choice-grid">
          {maskBorderStyleOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={draft.mask.border.style === option.id ? "is-active" : ""}
              onClick={() => handleBorderChange({ style: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
        <ControlSlider
          label="Ombre contour"
          min={0}
          max={1}
          step={0.01}
          value={draft.mask.border.shadow}
          onChange={(shadow) => handleBorderChange({ shadow })}
        />
      </div>
      <p className="ef-image-editor-hint">
        Glissez le masque pour le déplacer. Utilisez les coins pour redimensionner.
      </p>
    </>
  );
}

function FiltersPanel({ draft, setDraft }: PanelProps) {
  return (
    <div className="ef-image-editor-choice-grid">
      {filterOptions.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={draft.filter === filter.id ? "is-active" : ""}
          onClick={() => setDraft({ ...draft, filter: filter.id })}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function AdjustmentsPanel({ draft, setDraft }: PanelProps) {
  const update = (key: keyof ImageEditingState["adjustments"], value: number) =>
    setDraft({ ...draft, adjustments: { ...draft.adjustments, [key]: value } });
  return (
    <>
      <ControlSlider
        label="Luminosité"
        min={-1}
        max={1}
        step={0.01}
        value={draft.adjustments.brightness}
        onChange={(value) => update("brightness", value)}
      />
      <ControlSlider
        label="Contraste"
        min={-1}
        max={1}
        step={0.01}
        value={draft.adjustments.contrast}
        onChange={(value) => update("contrast", value)}
      />
      <ControlSlider
        label="Saturation"
        min={-1}
        max={1}
        step={0.01}
        value={draft.adjustments.saturation}
        onChange={(value) => update("saturation", value)}
      />
      <ControlSlider
        label="Exposition"
        min={-1}
        max={1}
        step={0.01}
        value={draft.adjustments.exposure}
        onChange={(value) => update("exposure", value)}
      />
      <ControlSlider
        label="Température"
        min={-1}
        max={1}
        step={0.01}
        value={draft.adjustments.temperature}
        onChange={(value) => update("temperature", value)}
      />
      <ControlSlider
        label="Teinte"
        min={-180}
        max={180}
        step={1}
        value={draft.adjustments.hue}
        onChange={(value) => update("hue", value)}
      />
      <ControlSlider
        label="Opacité"
        min={0}
        max={1}
        step={0.01}
        value={draft.adjustments.opacity}
        onChange={(value) => update("opacity", value)}
      />
    </>
  );
}

function EffectsPanel({ draft, setDraft }: PanelProps) {
  const update = (key: keyof ImageEditingState["adjustments"], value: number) =>
    setDraft({ ...draft, adjustments: { ...draft.adjustments, [key]: value } });
  return (
    <>
      <ControlSlider
        label="Flou"
        min={0}
        max={20}
        step={0.5}
        value={draft.adjustments.blur}
        onChange={(value) => update("blur", value)}
      />
      <ControlSlider
        label="Netteté"
        min={0}
        max={1}
        step={0.01}
        value={draft.adjustments.sharpness}
        onChange={(value) => update("sharpness", value)}
      />
      <ControlSlider
        label="Ombre"
        min={0}
        max={1}
        step={0.01}
        value={draft.adjustments.shadow}
        onChange={(value) => update("shadow", value)}
      />
      <ControlSlider
        label="Vignette"
        min={0}
        max={1}
        step={0.01}
        value={draft.adjustments.vignette}
        onChange={(value) => update("vignette", value)}
      />
      <ControlSlider
        label="Grain"
        min={0}
        max={1}
        step={0.01}
        value={draft.adjustments.grain}
        onChange={(value) => update("grain", value)}
      />
    </>
  );
}

function TransformPanel({ draft, setDraft }: PanelProps) {
  return (
    <>
      <div className="ef-image-editor-choice-grid">
        <button
          type="button"
          className={draft.transform.flipX ? "is-active" : ""}
          onClick={() =>
            setDraft({ ...draft, transform: { ...draft.transform, flipX: !draft.transform.flipX } })
          }
        >
          Miroir horizontal
        </button>
        <button
          type="button"
          className={draft.transform.flipY ? "is-active" : ""}
          onClick={() =>
            setDraft({ ...draft, transform: { ...draft.transform, flipY: !draft.transform.flipY } })
          }
        >
          Miroir vertical
        </button>
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              transform: { ...draft.transform, rotation: draft.transform.rotation - 90 },
            })
          }
        >
          90° gauche
        </button>
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              transform: { ...draft.transform, rotation: draft.transform.rotation + 90 },
            })
          }
        >
          90° droite
        </button>
      </div>
      <ControlSlider
        label="Rotation libre"
        min={-180}
        max={180}
        step={1}
        value={draft.transform.rotation}
        onChange={(rotation) => setDraft({ ...draft, transform: { ...draft.transform, rotation } })}
      />
      <button
        type="button"
        className="ef-image-editor-wide-button"
        onClick={() =>
          setDraft({ ...draft, transform: { flipX: false, flipY: false, rotation: 0 } })
        }
      >
        Reset transformation
      </button>
    </>
  );
}

type PanelProps = {
  draft: ImageEditingState;
  setDraft: (draft: ImageEditingState) => void;
};

function ControlSlider({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="ef-image-editor-control">
      <span>
        {label}
        <b>{Number.isInteger(value) ? value : value.toFixed(2)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ControlSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="ef-image-editor-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ControlColor({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="ef-image-editor-control">
      <ColorPickerControl
        label={label}
        value={value}
        onChange={(color) => color && onChange(color)}
      />
    </div>
  );
}
