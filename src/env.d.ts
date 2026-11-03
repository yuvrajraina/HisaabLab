/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
  readonly PUBLIC_ADS_ENABLED?: string;
  readonly PUBLIC_ADSENSE_PUBLISHER_ID?: string;
  readonly PUBLIC_ADSENSE_CALCULATOR_SLOT?: string;
  readonly PUBLIC_ADSENSE_ARTICLE_SLOT?: string;
}

interface ImportMeta { readonly env: ImportMetaEnv }
