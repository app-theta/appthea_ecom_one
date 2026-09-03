import { useI18n } from '../../context/I18nContext';
import { money } from '../../utils/format';
import { num, barcodes as barcodesOf, variantLabel, thumbOf } from '../../utils/product';
import { Img } from '../ui/Ui';
import VariantPicker from './VariantPicker';

/**
 * combo_type = "Same": tier promos on the product itself.
 * Every amount (combo_price, regular_total, savings_amount) is precomputed by
 * the backend — never recalculate it here.
 */
export default function ComboTiers({ tiers = [], selectedQty, onSelect, freePicks, onFreePick }) {
  const { t } = useI18n();
  if (!tiers.length) return null;

  return (
    <section className="mb-4">
      <div className="opt-label">{t('pdp.comboOffers')}</div>
      <p className="mute mb-3" style={{ fontSize: 'var(--fs-13)' }}>{t('pdp.comboNote')}</p>

      <div className="d-grid gap-2">
        {tiers.map((tier) => {
          const qty = num(tier.combo_qty);
          const active = Number(selectedQty) === qty;
          const free = num(tier.free_qty);
          const eligible = Array.isArray(tier.eligible_free_products) ? tier.eligible_free_products : [];

          return (
            <div key={qty}>
              <button type="button" className="promo" aria-pressed={active} onClick={() => onSelect(active ? null : tier)}>
                <div className="promo__top">
                  <span className="promo__qty">
                    {qty} {t('pdp.pieces')}
                    {free > 0 && <span className="mute"> + {free} {t('common.free')}</span>}
                  </span>
                  <span className="mono" style={{ fontSize: 'var(--fs-18)' }}>{money(tier.combo_price)}</span>
                </div>
                <div className="d-flex align-items-center gap-3 mt-2" style={{ fontSize: 'var(--fs-13)' }}>
                  <span className="mute text-decoration-line-through mono">{money(tier.regular_total)}</span>
                  {num(tier.savings_amount) > 0 && (
                    <span className="promo__save">{t('pdp.saveAmount')} {money(tier.savings_amount)}</span>
                  )}
                </div>
              </button>

              {active && free > 0 && (
                <FreeProductPicker
                  slots={free}
                  products={eligible}
                  picks={freePicks}
                  onPick={onFreePick}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** One row per free slot: choose a product, then a variant of that product. */
export function FreeProductPicker({ slots = 1, products = [], picks = [], onPick }) {
  const { t } = useI18n();
  if (!products.length) return null;

  return (
    <div className="free-pick mt-2">
      <div>
        <div className="opt-label mb-1">{t('pdp.pickFree')}</div>
        <small className="mute">{t('pdp.pickFreeNote')}</small>
      </div>

      {Array.from({ length: slots }).map((_, slot) => {
        const pick = picks[slot] || {};
        const chosen = products.find((p) => Number(p.id) === Number(pick.product_id));
        const chosenBarcodes = chosen ? barcodesOf(chosen) : [];
        return (
          <div key={slot} className="d-grid gap-2">
            <div className="d-flex flex-wrap gap-2">
              {products.map((p) => {
                const active = Number(pick.product_id) === Number(p.id);
                const bcs = barcodesOf(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="chip d-flex align-items-center gap-2"
                    aria-pressed={active}
                    onClick={() => onPick(slot, {
                      product_id: p.id,
                      barcode_id: bcs.length === 1 ? bcs[0].id : null,
                      name: p.name,
                      variant: bcs.length === 1 ? variantLabel(bcs[0]) : null,
                    })}
                  >
                    <span style={{ width: 26, height: 34, display: 'block', overflow: 'hidden', borderRadius: 3 }}>
                      <Img src={thumbOf(p)} alt="" label="" />
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>

            {chosen && chosenBarcodes.length > 1 && (
              <VariantPicker
                compact
                barcodes={chosenBarcodes}
                value={pick.barcode_id}
                label={t('pdp.selectVariant')}
                onChange={(b) => onPick(slot, { ...pick, barcode_id: b.id, variant: variantLabel(b) })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
