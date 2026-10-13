import { Link } from 'react-router-dom';
import Countdown from '../product/Countdown';
import { useI18n } from '../../context/I18nContext';
import { imageUrl, plain, truncate } from '../../utils/format';

/**
 * A running campaign's banner: its image (or a plain colour block), title, countdown to the end
 * and - on the home page - a link to the campaign page. `onEnd` runs when the countdown hits zero.
 */
export default function CampaignHero({ campaign, onEnd, linked = true, as: Title = 'h2' }) {
  const { t } = useI18n();
  const banner = imageUrl(campaign.banner);
  const about = plain(campaign.description);

  return (
    <div className={`campaign-hero ${banner ? 'has-banner' : ''}`}>
      {banner && <img className="campaign-hero__img" src={banner} alt="" loading="lazy" />}
      <div className="campaign-hero__body">
        <p className="campaign-hero__eyebrow">
          <i className="bi bi-lightning-charge-fill me-1" aria-hidden="true" />{t('deal.campaign')}
        </p>
        <Title className="campaign-hero__title">{campaign.title}</Title>
        {about && <p className="campaign-hero__about">{linked ? truncate(about, 140) : about}</p>}
        {linked && (
          <Link to={`/campaign/${campaign.slug}`} className="btn btn-light btn-sm campaign-hero__cta">
            {t('deal.shopCampaign')}
            {campaign.products_count > 0 && <span className="ms-1">({campaign.products_count})</span>}
            <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
          </Link>
        )}
      </div>
      {/* the countdown sits on the right (below the text on a phone) */}
      <div className="campaign-hero__ends">
        <span className="campaign-hero__ends-label">{t('deal.endsIn')}</span>
        <Countdown endsAt={campaign.ends_at} onEnd={onEnd} className="countdown--light" />
      </div>
    </div>
  );
}
