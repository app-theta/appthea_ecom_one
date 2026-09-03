import { useI18n } from '../../context/I18nContext';
import { money } from '../../utils/format';
import { num, barcodes as barcodesOf, variantLabel, thumbOf } from '../../utils/product';
import { Img } from '../ui/Ui';
import VariantPicker from './VariantPicker';

/**
 * combo_type = "Different": one or more bundles, each a fixed set of items.
 * `is_current_product` marks the item that IS the product being viewed — its
 * variant comes from the main picker; every other item needs its own choice.
 */
export default function BundleSelector({
  bundles = [], selectedId, onSelect, selections, onSelectItem, currentBarcodeId,
}) {
  const { t } = useI18n();
  if (!bundles.length) return null;

  return (
    <section className="mb-4">
      <div className="opt-label">{t('pdp.bundleOffers')}</div>
      <p className="mute mb-3" style={{ fontSize: 'var(--fs-13)' }}>{t('pdp.bundleNote')}</p>

      <div className="d-grid gap-2">
        {bundles.map((bundle) => {
          const active = Number(selectedId) === Number(bundle.id);
          const items = Array.isArray(bundle.items) ? bundle.items : [];

          return (
            <div key={bundle.id}>
              <button type="button" className="promo" aria-pressed={active} onClick={() => onSelect(active ? null : bundle)}>
                <div className="promo__top">
                  <span className="promo__qty">{bundle.name || `${items.length} ${t('pdp.pieces')}`}</span>
                  <span className="mono" style={{ fontSize: 'var(--fs-18)' }}>{money(bundle.price)}</span>
                </div>
                <div className="d-flex align-items-center gap-3 mt-2" style={{ fontSize: 'var(--fs-13)' }}>
                  <span className="mute text-decoration-line-through mono">{money(bundle.regular_total)}</span>
                  {num(bundle.savings_amount) > 0 && (
                    <span className="promo__save">{t('pdp.saveAmount')} {money(bundle.savings_amount)}</span>
                  )}
                </div>
                <ul className="promo__items">
                  {items.map((it, n) => (
                    <li key={`${it.product?.id ?? n}`}>
                      <i className="bi bi-dot" aria-hidden="true" />
                      <span>
                        {num(it.quantity) > 1 && `${it.quantity} × `}
                        {it.product?.name || `#${it.product?.id}`}
                        <span className="mute mono"> · {money(it.unit_price)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </button>

              {active && (
                <div className="free-pick mt-2">
                  <div className="opt-label mb-0">{t('pdp.pickItemVariant')}</div>
                  {items.map((it) => {
                    const product = it.product || {};
                    const bcs = barcodesOf(product);
                    const isCurrent = Boolean(it.is_current_product);
                    const chosen = isCurrent
                      ? currentBarcodeId
                      : selections?.[product.id]?.barcode_id ?? (bcs.length === 1 ? bcs[0].id : null);

                    return (
                      <div key={product.id} className="d-flex gap-3 align-items-start">
                        <span style={{ width: 46, flex: '0 0 46px', aspectRatio: '3 / 4', overflow: 'hidden', borderRadius: 4 }}>
                          <Img src={thumbOf(product)} alt="" label="" />
                        </span>
                        <div className="flex-grow-1">
                          <div style={{ fontSize: 'var(--fs-14)' }}>
                            {product.name}
                            {isCurrent && <span className="mute"> · {t('pdp.variant')} ↑</span>}
                          </div>
                          {!isCurrent && bcs.length > 1 && (
                            <VariantPicker
                              compact
                              barcodes={bcs}
                              value={chosen}
                              label=""
                              onChange={(b) => onSelectItem(product.id, { barcode_id: b.id, name: product.name, variant: variantLabel(b) })}
                            />
                          )}
                          {!isCurrent && bcs.length === 1 && (
                            <small className="mute">{variantLabel(bcs[0])}</small>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
