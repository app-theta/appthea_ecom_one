import { useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Injects per-page SEO meta tags (description/keywords/robots/canonical),
 * plus site-wide Open Graph and Twitter Card tags, from the `seoMetaInfos`
 * bundle returned by `basic/all/list`. `page` selects the `{page}_*` keys
 * (e.g. "home"). Does nothing at all when the tenant has the
 * `enable_meta_seo` business feature flag turned off.
 */
export function useSeoMeta(page) {
  const { features, seoMeta, info } = useBusiness();

  useEffect(() => {
    if (!features.enable_meta_seo || !seoMeta) return;

    upsertMeta('name', 'description', seoMeta[`${page}_description`]);
    upsertMeta('name', 'keywords', seoMeta[`${page}_keywords`]);
    upsertMeta('name', 'robots', seoMeta[`${page}_robots`]);
    upsertCanonical(seoMeta[`${page}_canonical_url`]);
    if (seoMeta.author) upsertMeta('name', 'author', seoMeta.author);

    upsertMeta('property', 'og:title', seoMeta.og_title || info?.name);
    upsertMeta('property', 'og:description', seoMeta.og_description || seoMeta[`${page}_description`]);
    upsertMeta('property', 'og:type', seoMeta.og_type || 'website');
    upsertMeta('property', 'og:url', seoMeta.og_url || window.location.href);
    upsertMeta('property', 'og:image', seoMeta.og_image);
    upsertMeta('property', 'og:site_name', seoMeta.og_site_name || info?.name);

    upsertMeta('name', 'twitter:card', seoMeta.twitter_card || 'summary_large_image');
    upsertMeta('name', 'twitter:title', seoMeta.twitter_title || seoMeta.og_title || info?.name);
    upsertMeta('name', 'twitter:description', seoMeta.twitter_description || seoMeta.og_description);
    upsertMeta('name', 'twitter:image', seoMeta.twitter_image || seoMeta.og_image);
  }, [features.enable_meta_seo, seoMeta, info?.name, page]);
}

export default useSeoMeta;
