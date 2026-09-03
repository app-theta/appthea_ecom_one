import { useI18n } from '../../context/I18nContext';
import { variantLabel, swatchColour, inStock, stockOf } from '../../utils/product';

/**
 * Renders a product's barcodes as selectable options. Colour-bearing barcodes
 * become swatches; everything else becomes a labelled chip.
 */
export default function VariantPicker({ barcodes = [], value, onChange, label, compact = false }) {
  const { t } = useI18n();
  if (barcodes.length <= 1) return null;

  const asSwatches = barcodes.every((b) => swatchColour(b));

  return (
    <div className={compact ? '' : 'mb-4'}>
      <div className="opt-label">{label || t('pdp.variant')}</div>
      <div className="chip-row">
        {barcodes.map((b) => {
          const selected = Number(value) === Number(b.id);
          const available = inStock(b);
          return asSwatches ? (
            <button
              key={b.id}
              type="button"
              className="swatch"
              aria-pressed={selected}
              disabled={!available}
              title={`${variantLabel(b)}${available ? '' : ` — ${t('pdp.outOfStock')}`}`}
              onClick={() => onChange(b)}
            >
              <span style={{ background: swatchColour(b) }} />
            </button>
          ) : (
            <button
              key={b.id}
              type="button"
              className="chip"
              aria-pressed={selected}
              disabled={!available}
              onClick={() => onChange(b)}
            >
              {variantLabel(b)}
            </button>
          );
        })}
      </div>
      {value != null && (() => {
        const chosen = barcodes.find((b) => Number(b.id) === Number(value));
        const s = stockOf(chosen);
        if (!chosen) return null;
        return s > 0 && s <= 5
          ? <p className="mt-2 mb-0" style={{ fontSize: 'var(--fs-12)', color: 'var(--flame)' }}>{s} {t('pdp.left')}</p>
          : null;
      })()}
    </div>
  );
}
