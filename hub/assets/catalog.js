(() => {
  const list = document.querySelector('#product-list');
  const search = document.querySelector('#product-search');
  const sort = document.querySelector('#product-sort');
  const count = document.querySelector('#result-count');
  const filters = [...document.querySelectorAll('[data-category-filter]')];
  const brand = document.querySelector('#product-brand');
  const consent = document.querySelector('#analytics-consent');
  const dialog = document.querySelector('#product-dialog');
  const hero = document.querySelector('[data-hero-variant]');
  if (!list || !search || !sort || !count) return;
  if (!document.querySelector('.hub-skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'hub-skip-link'; skip.href = '#hub-main'; skip.textContent = 'Skip to products';
    document.body.prepend(skip);
  }
  const liveStatus = document.createElement('div');
  liveStatus.className = 'hub-sr-only'; liveStatus.setAttribute('role', 'status'); liveStatus.setAttribute('aria-live', 'polite');
  document.body.append(liveStatus);
  const cards = [...list.querySelectorAll('[data-product]')];
  let visibleLimit = 8;
  const showMore = document.createElement('button');
  showMore.type = 'button';
  showMore.className = 'hub-show-more';
  showMore.textContent = 'Show more products';
  list.insertAdjacentElement('afterend', showMore);
  let category = 'all';
  let business = 'all';
  let searchReported = false;
  const storage = {
    get: key => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch {} },
  };
  const sourcePlatform = (() => {
    const tagged = document.querySelector('meta[name="hub-source"]')?.content;
    if (['instagram', 'tiktok', 'facebook', 'youtube', 'direct', 'other'].includes(tagged)) return tagged;
    let host = '';
    try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch {}
    if (!host) return 'direct';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('facebook')) return 'facebook';
    if (host.includes('youtube')) return 'youtube';
    return 'other';
  })();
  const analyticsAllowed = () => storage.get('hub_analytics_consent') === 'granted';
  const hubExperience = (() => {
    try {
      const raw = document.querySelector('#hub-experience')?.textContent;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const experimentIds = {
    hero: hubExperience?.hero?.experimentId ?? null,
    sort: hubExperience?.sort?.experimentId ?? null,
    rail: hubExperience?.rail?.experimentId ?? null,
  };
  let recommendationMap = hubExperience?.recommendations ?? {};
  const railMode = hubExperience?.rail?.mode ?? 'velocity';
  let sortManual = storage.get('hub_sort_manual') === '1';
  const report = (eventType, payload = {}) => {
    if (!analyticsAllowed()) return;
    fetch('/hub/event', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventType,
        payload: {
          ...payload,
          sourcePlatform,
          experimentId: payload.experimentId ?? null,
          rankingModel: hubExperience?.rankingModel ?? null,
          rankingVersion: hubExperience?.rankingVersion ?? null,
          eventNonce: crypto.randomUUID(),
        },
      }),
      keepalive: true,
    }).catch(() => {});
  };
  const vitalRating = (metric, value) => {
    const limits = { LCP: [2500, 4000], CLS: [0.1, 0.25], INP: [200, 500], FCP: [1800, 3000], TTFB: [800, 1800] }[metric] || [Infinity, Infinity];
    return value <= limits[0] ? 'good' : value <= limits[1] ? 'needs-improvement' : 'poor';
  };
  const sendVital = (metric, value) => report('web_vital', { metric, value: Math.round(value * (metric === 'CLS' ? 1000 : 1)) / (metric === 'CLS' ? 1000 : 1), rating: vitalRating(metric, value) });
  let webVitalsStarted = false;
  const startWebVitals = () => {
    if (webVitalsStarted || !analyticsAllowed()) return;
    webVitalsStarted = true;
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) sendVital('TTFB', navigation.responseStart);
      const paint = performance.getEntriesByName('first-contentful-paint')[0];
      if (paint) sendVital('FCP', paint.startTime);
      let lcp = 0, cls = 0, inp = 0;
      new PerformanceObserver(entries => { for (const entry of entries.getEntries()) lcp = Math.max(lcp, entry.startTime); }).observe({ type: 'largest-contentful-paint', buffered: false });
      new PerformanceObserver(entries => { for (const entry of entries.getEntries()) if (!entry.hadRecentInput) cls += entry.value; }).observe({ type: 'layout-shift', buffered: false });
      new PerformanceObserver(entries => { for (const entry of entries.getEntries()) inp = Math.max(inp, entry.duration || 0); }).observe({ type: 'event', buffered: false, durationThreshold: 40 });
      addEventListener('pagehide', () => { if (lcp) sendVital('LCP', lcp); sendVital('CLS', cls); if (inp) sendVital('INP', inp); }, { once: true });
    } catch {}
  };
  const formatMoney = cents => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
  const HUB_QTY_MAX = 50;
  const readQty = scope => {
    const value = Number(scope.querySelector('[data-qty-value]')?.textContent ?? '1');
    return Number.isFinite(value) && value >= 1 ? Math.min(HUB_QTY_MAX, Math.floor(value)) : 1;
  };
  const writeQty = (scope, qty) => {
    const output = scope.querySelector('[data-qty-value]');
    if (output) output.textContent = String(qty);
    scope.querySelector('[data-qty-dec]')?.toggleAttribute('disabled', qty <= 1);
    scope.querySelector('[data-qty-inc]')?.toggleAttribute('disabled', qty >= HUB_QTY_MAX);
  };
  const getUnitCents = scope => {
    const link = scope.querySelector('a[data-buy-direct]');
    const fromLink = Number(link?.dataset.unitCents);
    if (Number.isFinite(fromLink) && fromLink > 0) return fromLink;
    const card = scope.closest('[data-product]') || scope;
    const price = Number(card.dataset?.price);
    if (Number.isFinite(price) && price > 0) return Math.round(price * 100);
    return 0;
  };
  const activePickVariant = (scope, config) => {
    if (!config?.variants?.length) return null;
    const mount = scope.querySelector('[data-pick-variants], .pick-variants');
    return findPickVariant(
      config,
      mount?.querySelector('[data-pick-color][aria-pressed="true"]')?.dataset.pickColor ?? config.colors?.[0],
      mount?.querySelector('[data-pick-pack][aria-pressed="true"]')?.dataset.pickPack ?? config.packs?.[0],
    );
  };
  const productEventIdentity = scope => {
    const link = scope?.querySelector?.('a[data-buy-direct][data-catalog-line-id]');
    return {
      catalogLineId: link?.dataset.catalogLineId || null,
      sourcePriceId: link?.dataset.sourcePriceId || null,
      variantName: link?.dataset.variantLabel || null,
      sku: link?.dataset.variantSku || null,
    };
  };
  const applyVariantToBuyLink = (link, variant, qty = 1) => {
    if (!link || !variant?.id) return;
    const url = new URL(link.href, location.origin);
    if (variant.destinationSlug) url.pathname = `/hub/buy/${variant.destinationSlug}`;
    url.searchParams.set('vid', variant.id);
    if (qty > 1) url.searchParams.set('qty', String(qty));
    else url.searchParams.delete('qty');
    link.href = url.toString();
    if (!link.dataset.buyDirect) return;
    link.dataset.unitCents = String(variant.unitAmount);
    if (variant.priceId) link.dataset.sourcePriceId = variant.priceId;
    link.dataset.catalogLineId = `variant:${String(link.closest('[data-product], .product-dialog')?.dataset.productName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}:${variant.id}`;
    link.dataset.variantLabel = variant.label || '';
    link.dataset.variantSku = variant.sku || '';
    const textNode = [...link.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
    const total = formatMoney(variant.unitAmount * qty);
    if (textNode) textNode.textContent = qty > 1 ? `Checkout · ${total} · ${qty}` : `Checkout · ${total}`;
  };
  const updateDirectCheckoutLinks = scope => {
    const qty = readQty(scope);
    const config = readPickConfig(scope.querySelector('[data-pick-variants], .pick-variants'));
    const variant = activePickVariant(scope, config);
    const unitCents = variant?.unitAmount ?? getUnitCents(scope);
    scope.querySelectorAll('a[data-buy-direct], a.buy.primary.direct').forEach(link => {
      if (variant?.id) {
        applyVariantToBuyLink(link, variant, qty);
        return;
      }
      const url = new URL(link.href, location.origin);
      url.searchParams.delete('vid');
      if (qty > 1) url.searchParams.set('qty', String(qty));
      else url.searchParams.delete('qty');
      link.href = url.toString();
      if (!link.dataset.buyDirect) return;
      link.dataset.unitCents = String(unitCents);
      const textNode = [...link.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
      const total = formatMoney(unitCents * qty);
      if (textNode) textNode.textContent = qty > 1 ? `Checkout · ${total} · ${qty}` : `Checkout · ${total}`;
    });
  };
  const bindQtyStepper = scope => {
    const stepper = scope.querySelector('[data-qty-stepper]');
    if (!stepper) return;
    writeQty(scope, readQty(scope));
    stepper.querySelector('[data-qty-dec]')?.addEventListener('click', () => {
      writeQty(scope, Math.max(1, readQty(scope) - 1));
      updateDirectCheckoutLinks(scope);
    });
    stepper.querySelector('[data-qty-inc]')?.addEventListener('click', () => {
      writeQty(scope, Math.min(HUB_QTY_MAX, readQty(scope) + 1));
      updateDirectCheckoutLinks(scope);
    });
    updateDirectCheckoutLinks(scope);
  };
  const readPickConfig = mount => {
    if (!mount) return null;
    const template = mount.querySelector('template.pick-config');
    const fromTemplate = template?.content?.textContent?.trim() || template?.textContent?.trim();
    if (fromTemplate) {
      try {
        return JSON.parse(fromTemplate);
      } catch {
        return null;
      }
    }
    if (!mount.dataset.pickVariants) return null;
    try {
      return JSON.parse(mount.dataset.pickVariants);
    } catch {
      return null;
    }
  };
  const findPickVariant = (config, color, pack) => {
    if (!config?.variants?.length) return null;
    const match = config.variants.find(variant =>
      (!config.colors?.length || variant.color === color) &&
      (!config.packs?.length || variant.pack === pack),
    );
    return match || config.variants.find(variant => variant.id === config.defaultId) || config.variants[0];
  };
  const setBuyLinkVariant = (link, variant, qty = 1) => applyVariantToBuyLink(link, variant, qty);
  const syncPickVariant = (scope, variant, config) => {
    if (!variant) return;
    scope.querySelector('.card-price, .dialog-price')?.replaceChildren(document.createTextNode(formatMoney(variant.unitAmount)));
    scope.querySelectorAll('a[data-buy-direct]').forEach(link => { link.dataset.unitCents = String(variant.unitAmount); });
    scope.querySelectorAll('.marketplace-hints .hint.etsy, .dialog-marketplace-hints-mount .hint.etsy').forEach(link => {
      if (!variant.etsyDestinationSlug) {
        link.hidden = false;
        return;
      }
      const slug = link.pathname.split('/hub/buy/')[1]?.split('?')[0];
      link.hidden = slug !== variant.etsyDestinationSlug;
    });
    const mount = scope.querySelector('[data-pick-variants], .pick-variants');
    if (mount) mount.dataset.defaultVid = variant.id;
    if (scope.dataset?.product) scope.dataset.price = String(variant.unitAmount / 100);
    updateDirectCheckoutLinks(scope);
  };
  const bindPickVariants = scope => {
    const mount = scope.querySelector('[data-pick-variants], .pick-variants');
    const config = readPickConfig(mount);
    if (!mount || !config) return;
    const defaultVariant = findPickVariant(
      config,
      mount.querySelector('[data-pick-color][aria-pressed="true"]')?.dataset.pickColor ?? config.colors?.[0],
      mount.querySelector('[data-pick-pack][aria-pressed="true"]')?.dataset.pickPack ?? config.packs?.[0],
    );
    syncPickVariant(scope, defaultVariant, config);
    const applySelection = () => {
      const color = mount.querySelector('[data-pick-color][aria-pressed="true"]')?.dataset.pickColor ?? config.colors?.[0];
      const pack = mount.querySelector('[data-pick-pack][aria-pressed="true"]')?.dataset.pickPack ?? config.packs?.[0];
      syncPickVariant(scope, findPickVariant(config, color, pack), config);
    };
    mount.querySelectorAll('[data-pick-color]').forEach(button => {
      button.addEventListener('click', () => {
        mount.querySelectorAll('[data-pick-color]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        applySelection();
      });
    });
    mount.querySelectorAll('[data-pick-pack]').forEach(button => {
      button.addEventListener('click', () => {
        mount.querySelectorAll('[data-pick-pack]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        applySelection();
      });
    });
  };
  let dialogOpener = null;
  let dialogHistoryActive = false;
  const closeDialog = (fromHistory = false) => {
    if (!dialog?.open) return;
    if (!fromHistory && dialogHistoryActive && history.state?.hubProduct) { history.back(); return; }
    dialogHistoryActive = false;
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); document.body.style.overflow = ''; dialogOpener?.focus(); }
  };
  const openDialog = (card, placement = 'product-card', trigger = null) => {
    if (!dialog) return;
    dialogOpener = trigger || card.querySelector('[data-quick-view]');
    dialog.dataset.productName = card.dataset.productName || '';
    dialog.dataset.business = card.dataset.business || '';
    dialog.dataset.category = card.dataset.category || '';
    dialog.dataset.productThumb = card.querySelector('img')?.getAttribute('src') || '';
    dialog.querySelector('.dialog-brand').textContent = card.querySelector('small')?.textContent || '';
    const productName = card.querySelector('h3')?.textContent || '';
    dialog.querySelector('#dialog-title').textContent = productName;
    const source = card.querySelector('template[data-quick-content]')?.content;
    const gallery = dialog.querySelector('.dialog-gallery');
    const thumbs = dialog.querySelector('.dialog-thumbs');
    const facts = dialog.querySelector('.dialog-facts');
    const sections = dialog.querySelector('.dialog-sections');
    const actions = dialog.querySelector('.dialog-actions');
    gallery.replaceChildren(...[...(source?.querySelectorAll('[data-quick-images] img') || [])].reduce((items, image) => {
      if (items.some(item => item.src === image.src)) return items;
      const clone = image.cloneNode(true);
      clone.removeAttribute('width');
      clone.removeAttribute('height');
      items.push(clone);
      return items;
    }, []));
    gallery.scrollLeft = 0;
    const firstGalleryImage=gallery.querySelector('img');
    if(firstGalleryImage){firstGalleryImage.loading='eager';firstGalleryImage.fetchPriority='high';}
    const images = [...gallery.querySelectorAll('img')];
    gallery.classList.toggle('is-single', images.length < 2);
    const markPortrait = (image) => {
      if (image.naturalWidth && image.naturalHeight > image.naturalWidth) image.classList.add('is-portrait');
      else image.classList.remove('is-portrait');
    };
    images.forEach((image) => {
      if (image.complete) markPortrait(image);
      else image.addEventListener('load', () => markPortrait(image), { once: true });
    });
    thumbs.replaceChildren(...images.map((image, index) => {
      const button = document.createElement('div');
      button.className = 'dialog-thumb';
      button.setAttribute('aria-label', `Show photo ${index + 1} of ${images.length}`);
      button.setAttribute('aria-current', String(index === 0));
      const thumb = image.cloneNode(true);
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      button.append(thumb);
      button.addEventListener('click', () => { image.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'start' }); });
      return button;
    }));
    thumbs.hidden = images.length < 2;
    gallery.onscroll = () => {
      const active = images.reduce((best, image, index) => Math.abs(image.offsetLeft - gallery.scrollLeft) < best.distance ? { index, distance: Math.abs(image.offsetLeft - gallery.scrollLeft) } : best, { index: 0, distance: Infinity }).index;
      [...thumbs.children].forEach((thumb, index) => thumb.setAttribute('aria-current', String(index === active)));
    };
    gallery.onscrollend = gallery.onscroll;
    dialog.querySelector('.dialog-price').textContent = source?.querySelector('[data-quick-price]')?.textContent || '';
    dialog.querySelector('.dialog-story').textContent = source?.querySelector('[data-quick-story]')?.textContent || '';
    facts.replaceChildren(...[...(source?.querySelectorAll('[data-quick-highlights] li') || [])].map(item => item.cloneNode(true)));
    facts.hidden = facts.children.length === 0;
    sections.replaceChildren(...[...(source?.querySelectorAll('[data-quick-sections] section') || [])].map(section => section.cloneNode(true)));
    sections.hidden = sections.children.length === 0;
    dialog.querySelector('.dialog-fulfillment').textContent = source?.querySelector('[data-quick-fulfillment]')?.textContent || '';
    let pickMount = dialog.querySelector('.dialog-pick-mount');
    if (!pickMount) {
      pickMount = document.createElement('div');
      pickMount.className = 'dialog-pick-mount';
      actions.before(pickMount);
    }
    const cardPick = card.querySelector('.pick-variants');
    if (cardPick) {
      pickMount.replaceChildren(cardPick.cloneNode(true));
      pickMount.hidden = false;
    } else {
      pickMount.replaceChildren();
      pickMount.hidden = true;
    }
    const buyLinks = [...(card.querySelectorAll('.channel-buttons a') || [])].map(link => {
      const clone = link.cloneNode(true);
      delete clone.dataset.cartBound;
      delete clone.dataset.centralBuyBound;
      const url = new URL(clone.href);
      url.searchParams.set('p', 'quick-view');
      clone.href = url.toString();
      return clone;
    });
    actions.className = `dialog-actions channel-buttons channel-buttons--compact${buyLinks.length > 1 ? ' channel-buttons--pair' : ''}`;
    actions.replaceChildren(...buyLinks);
    // Keep purchase controls after product information; CSS pins this bar to dialog bottom.
    const trust = dialog.querySelector('.dialog-trust');
    if (trust) trust.after(actions);
    const cardQty = card.querySelector('[data-qty-stepper]');
    if (cardQty) {
      const qtyClone = cardQty.cloneNode(true);
      actions.prepend(qtyClone);
      actions.classList.add('dialog-actions-with-qty');
    } else {
      actions.classList.remove('dialog-actions-with-qty');
    }
    if (cardPick) {
      bindPickVariants(dialog);
      dialog.querySelector('.dialog-price').textContent = card.querySelector('.card-price')?.textContent || dialog.querySelector('.dialog-price')?.textContent || '';
    }
    bindQtyStepper(dialog);
    const hintMount = dialog.querySelector('.dialog-marketplace-hints-mount');
    const cardHints = card.querySelector('.marketplace-hints');
    const sourceHints = source?.querySelector('[data-quick-marketplace-hints]')?.innerHTML?.trim();
    if (hintMount) {
      if (cardHints) {
        hintMount.innerHTML = cardHints.outerHTML;
        // Show one clear destination per marketplace, never duplicate cramped links.
        const seenHints = new Set();
        hintMount.querySelectorAll('.hint').forEach(link => {
          const key = [...link.classList].find(name => ['etsy', 'tiktok', 'amazon', 'walmart'].includes(name)) || link.textContent?.trim();
          if (seenHints.has(key)) link.remove();
          else seenHints.add(key);
        });
        hintMount.querySelectorAll('a[href]').forEach(link => {
          const url = new URL(link.href);
          url.searchParams.set('p', 'quick-view');
          link.href = url.toString();
        });
        hintMount.hidden = false;
      } else if (sourceHints) {
        hintMount.innerHTML = sourceHints;
        hintMount.querySelectorAll('a[href]').forEach(link => {
          const url = new URL(link.href);
          url.searchParams.set('p', 'quick-view');
          link.href = url.toString();
        });
        hintMount.hidden = false;
      } else {
        hintMount.replaceChildren();
        hintMount.hidden = true;
      }
    }
    const extraBuy = dialog.querySelector('.dialog-more-buy-mount');
    const sourceExtra = source?.querySelector('[data-quick-buy-extra]');
    if (extraBuy) {
      if (sourceExtra) {
        extraBuy.replaceChildren(sourceExtra.cloneNode(true));
        extraBuy.querySelectorAll('a[href]').forEach(link => {
          const url = new URL(link.href);
          url.searchParams.set('p', 'quick-view');
          link.href = url.toString();
        });
        extraBuy.hidden = false;
      } else {
        extraBuy.replaceChildren();
        extraBuy.hidden = true;
      }
    }
    bindAddToCartLinks(dialog);
    dialog.querySelector('.dialog-scroll')?.scrollTo?.(0, 0);
    const relatedItem = (relatedCard, reason) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'related-item';
      const name = relatedCard.querySelector('h3')?.textContent || '';
      const business = (relatedCard.querySelector('small')?.textContent || '').trim();
      const media = document.createElement('span');
      media.className = 'related-media';
      const image = relatedCard.querySelector('.product-image')?.cloneNode(true);
      if (image) {
        image.loading = 'lazy';
        image.decoding = 'async';
        image.removeAttribute('width');
        image.removeAttribute('height');
        image.removeAttribute('style');
        image.alt = name;
        image.className = '';
        media.append(image);
      }
      const copy = document.createElement('div');
      copy.className = 'related-copy';
      const strong = document.createElement('strong');
      strong.textContent = name;
      const meta = document.createElement('span');
      const parts = [];
      if (business && business.toLowerCase() !== name.toLowerCase() && !name.toLowerCase().startsWith(business.toLowerCase())) parts.push(business);
      meta.textContent = parts.join(' · ');
      meta.hidden = parts.length === 0;
      const price = document.createElement('em');
      price.textContent = relatedCard.querySelector('.card-price')?.textContent || 'View';
      copy.append(strong, meta, price);
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'related-open';
      open.append(media, copy);
      open.setAttribute('aria-label', `View ${name} details`);
      open.addEventListener('click', () => openDialog(relatedCard, reason, open));
      const actions = document.createElement('div');
      actions.className = 'related-actions';
      const sourceActions = relatedCard.querySelector('.buy-checkout-row, .channel-buttons');
      [...(sourceActions?.querySelectorAll('a[data-buy-direct]') || [])].slice(0, 2).forEach(source => {
        const clone = source.cloneNode(true);
        clone.removeAttribute('id');
        actions.append(clone);
      });
      bindAddToCartLinks(actions);
      button.append(open, actions);
      return button;
    };
    const findCard = name => cards.find(item => item.dataset.productName === name || item.querySelector('h3')?.textContent === name);
    const bundleMount = dialog.querySelector('.dialog-bundle');
    const bundleList = dialog.querySelector('.dialog-bundle-list');
    const bundleLabel = dialog.querySelector('.dialog-bundle-label');
    if (bundleMount && bundleList && bundleLabel) {
      const bundleNames = (card.dataset.bundle || '').split('|').map(name => name.trim()).filter(Boolean);
      const bundleCards = bundleNames.map(findCard).filter(Boolean);
      const label = (card.dataset.bundleLabel || '').trim();
      bundleLabel.textContent = label;
      bundleLabel.hidden = !label;
      bundleList.replaceChildren(...bundleCards.map(item => relatedItem(item, 'bundle')));
      bundleMount.hidden = bundleCards.length === 0;
    }
    const anchorMount = dialog.querySelector('.dialog-anchor');
    anchorMount?.classList.add('bundle-anchor-rail');
    const anchorCopy = dialog.querySelector('.dialog-anchor-copy');
    const anchorOpen = dialog.querySelector('.dialog-anchor-open');
    if (anchorMount && anchorCopy && anchorOpen) {
      const anchorName = (card.dataset.anchor || '').trim();
      const anchorCard = anchorName ? findCard(anchorName) : null;
      if (anchorCard && anchorCard !== card) {
        const anchorPrice = anchorCard.querySelector('.card-price')?.textContent || '';
        const hook = anchorCard.querySelector('.value-hook')?.textContent || '';
        anchorCopy.textContent = hook || `Most shoppers upgrade to ${anchorName} (${anchorPrice}) for the best bundle math vs singles.`;
        anchorOpen.textContent = `Upgrade · ${anchorName} · ${anchorPrice}`;
        anchorOpen.onclick = () => openDialog(anchorCard, 'anchor-upsell', anchorOpen);
        anchorMount.hidden = false;
      } else anchorMount.hidden = true;
    }
    const relatedMount = dialog.querySelector('.dialog-related');
    const relatedList = dialog.querySelector('.dialog-related-list');
    const relatedTitle = dialog.querySelector('.dialog-related-title');
    if (relatedMount && relatedList && relatedTitle) {
      const bundleNameSet = new Set((card.dataset.bundle || '').split('|').map(name => name.trim()).filter(Boolean));
      const learned = (recommendationMap[productName] ?? []).map(entry => entry.productName).filter(name => name && name !== productName);
      const relatedNames = (learned.length
        ? learned
        : (card.dataset.related || '').split('|').map(name => name.trim()).filter(Boolean)
      ).filter(name => !bundleNameSet.has(name));
      const relatedCards = relatedNames.map(findCard).filter(Boolean);
      relatedTitle.textContent = learned.length ? 'Recommended for you' : (card.dataset.relatedTitle || 'People also check');
      relatedList.replaceChildren(...relatedCards.map(item => relatedItem(item, 'related')));
      relatedMount.hidden = relatedCards.length === 0;
    }
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    document.body.style.overflow = 'hidden';
    if (!dialogHistoryActive) { history.pushState({ hubProduct: card.dataset.productId }, '', `#product=${encodeURIComponent(card.dataset.productId || productName)}`); dialogHistoryActive = true; }
    dialog.querySelector('#dialog-title')?.focus();
    const itemIdentity = productEventIdentity(card);
    report('product_viewed', { product: productName.slice(0, 80), business: card.dataset.business, placement, ...itemIdentity });
    report('select_item', { product: productName.slice(0, 80), business: card.dataset.business, placement, ...itemIdentity });
  };
  document.querySelectorAll('[data-quick-view]').forEach(button => button.addEventListener('click', () => openDialog(button.closest('[data-product]'),'product-card',button)));
  document.querySelector('[data-featured-quick-view]')?.addEventListener('click', event => {
    const name=event.currentTarget.dataset.featuredQuickView;
    const card=cards.find(item=>item.querySelector('h3')?.textContent===name);
    if(card)openDialog(card,'featured',event.currentTarget);
  });
  dialog?.querySelector('.dialog-close')?.addEventListener('click', closeDialog);
  dialog?.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  dialog?.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  dialog?.addEventListener('close', () => { document.body.style.overflow = ''; dialogOpener?.focus(); });
  addEventListener('popstate', () => { if (dialog?.open && dialogHistoryActive) closeDialog(true); });
  cards.forEach((card, index) => { card.dataset.featuredRank = String(index); bindPickVariants(card); bindQtyStepper(card); });
  if (hero) bindQtyStepper(hero);
  const buildRailChip = (card, placement) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'top-seller-chip';
    const image = card.querySelector('.product-image')?.cloneNode();
    if (image) { image.className = 'top-seller-chip-image'; image.loading = 'lazy'; image.decoding = 'async'; button.append(image); }
    const strong = document.createElement('strong');
    strong.textContent = card.querySelector('h3')?.textContent || '';
    const span = document.createElement('span');
    span.textContent = card.querySelector('small')?.textContent || '';
    const em = document.createElement('em');
    em.textContent = card.querySelector('.card-price')?.textContent || 'View';
    button.append(strong, span, em);
    button.addEventListener('click', () => openDialog(card, placement, button));
    return button;
  };
  const topRail = document.querySelector('#top-seller-rail');
  const sortCardsForRail = (mode) => {
    if (mode === 'aov') {
      return [...cards].sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price) || Number(b.dataset.score) - Number(a.dataset.score));
    }
    return [...cards].sort((a, b) => Number(b.dataset.score) - Number(a.dataset.score) || Number(b.dataset.liveSales) - Number(a.dataset.liveSales) || Number(b.dataset.views) - Number(a.dataset.views));
  };
  const refreshRails = () => {
    if (topRail) {
      const top = sortCardsForRail(railMode).slice(0, 6);
      topRail.replaceChildren(...top.map(card => buildRailChip(card, 'top-seller')));
    }
  };
  if (topRail) refreshRails();
  const syncFeatured = (card, selectionReason) => {
    if (!hero) return;
    hero.hidden = !card;
    if (!card) return;
    const name = card.querySelector('h3')?.textContent || '';
    if (!name) return;
    const image = card.querySelector('.product-image');
    const primary = card.querySelector('.channel-buttons a');
    const details = card.querySelector('.product-copy > p');
    const facts = [...(card.querySelector('template[data-quick-content]')?.content.querySelectorAll('li') || [])];
    const brand = card.querySelector('small')?.textContent || '';
    const heroImage = hero.querySelector('.feature-image');
    const heroBuy = hero.querySelector('.buy');
    hero.dataset.heroVariant = name;
    hero.dataset.selectionReason = selectionReason;
    hero.dataset.productName = card.dataset.productName || name;
    hero.dataset.business = card.dataset.business || '';
    hero.dataset.category = card.dataset.category || '';
    hero.dataset.productThumb = card.querySelector('img')?.getAttribute('src') || '';
    hero.querySelector('.feature-copy small').textContent = `Top match · ${brand}`;
    hero.querySelector('h2').textContent = name;
    hero.querySelector('.feature-copy > p').textContent = details?.textContent || '';
    hero.querySelector('ul').replaceChildren(...facts.slice(0, 2).map(fact => fact.cloneNode(true)));
    hero.querySelector('[data-featured-quick-view]').dataset.featuredQuickView = name;
    if (image && heroImage) { heroImage.src = image.src; heroImage.alt = `${name} product`; }
    if (primary && heroBuy) {
      const url = new URL(primary.href);
      url.searchParams.set('p', 'featured');
      url.searchParams.set('v', name);
      url.searchParams.set('r', selectionReason);
      const qty = readQty(card);
      if (qty > 1) url.searchParams.set('qty', String(qty));
      else url.searchParams.delete('qty');
      heroBuy.href = url.toString();
      heroBuy.dataset.unitCents = primary.dataset.unitCents || String(getUnitCents(card));
      heroBuy.dataset.catalogLineId = primary.dataset.catalogLineId || '';
      heroBuy.dataset.sourcePriceId = primary.dataset.sourcePriceId || '';
      heroBuy.dataset.variantLabel = primary.dataset.variantLabel || '';
      heroBuy.dataset.variantSku = primary.dataset.variantSku || '';
      const unitCents = Number(heroBuy.dataset.unitCents) || getUnitCents(card);
      const total = formatMoney(unitCents * qty).replace('$', '');
      const label = qty > 1 ? `Checkout · ${total} · ${qty}` : primary.textContent.replace(/[→↗]\s*$/, '').trim();
      heroBuy.replaceChildren(document.createTextNode(label), Object.assign(document.createElement('span'), { textContent: '→', ariaHidden: 'true' }));
      const heroQty = hero.querySelector('[data-qty-value]');
      const cardQty = card.querySelector('[data-qty-value]');
      if (heroQty && cardQty) heroQty.textContent = cardQty.textContent;
    }
    report('hero_viewed', { variant: name, selectionReason, sortMode: sort.value, category, experimentId: experimentIds.hero });
  };
  const update = (selectionReason = null) => {
    const term = search.value.trim().toLowerCase();
    const mode = sort.value;
    cards.sort((a, b) => mode === 'trending'
      ? Number(b.dataset.score) - Number(a.dataset.score) || Number(b.dataset.liveSales) - Number(a.dataset.liveSales) || Number(b.dataset.views) - Number(a.dataset.views)
      : mode === 'personalized'
        ? Number(a.dataset.rank) - Number(b.dataset.rank)
      : mode === 'best-sellers'
      ? Number(b.dataset.liveSales) - Number(a.dataset.liveSales) || Number(b.dataset.sales) - Number(a.dataset.sales) || Number(b.dataset.views) - Number(a.dataset.views)
      : mode === 'most-viewed'
        ? Number(b.dataset.views) - Number(a.dataset.views) || Number(b.dataset.liveSales) - Number(a.dataset.liveSales)
      : mode === 'price-low'
      ? Number(a.dataset.price) - Number(b.dataset.price)
      : mode === 'price-high'
        ? Number(b.dataset.price) - Number(a.dataset.price)
        : mode === 'name'
          ? a.dataset.name.localeCompare(b.dataset.name)
          : Number(a.dataset.featuredRank) - Number(b.dataset.featuredRank));
    if (!term && category === 'all' && business === 'all' && ['trending', 'best-sellers', 'personalized'].includes(mode)) {
      const queues = new Map();
      cards.forEach(card => { const key = card.dataset.business || 'Other'; if (!queues.has(key)) queues.set(key, []); queues.get(key).push(card); });
      const diversified = [];
      while (diversified.length < cards.length) queues.forEach(queue => { const next = queue.shift(); if (next) diversified.push(next); });
      cards.splice(0, cards.length, ...diversified);
    }
    let shown = 0;
    let matched = 0;
    cards.forEach(card => {
      const categoryMatch = category === 'all' || card.dataset.category === category;
      const businessMatch = business === 'all' || card.dataset.business === business;
      const searchMatch = !term || card.dataset.name.toLowerCase().includes(term) || card.dataset.category.includes(term);
      const matches = categoryMatch && businessMatch && searchMatch;
      if (matches) matched += 1;
      const visible = matches && matched <= visibleLimit;
      card.hidden = !visible;
      card.style.display = visible ? '' : 'none';
      if (visible) shown += 1;
    });
    cards.forEach(card => list.append(card));
    count.textContent = matched === shown ? `${shown} product${shown === 1 ? '' : 's'}` : `Showing ${shown} of ${matched} products`;
    showMore.hidden = shown >= matched;
    showMore.textContent = `Show more products (${matched - shown} remaining)`;
    const brandUpsell = document.querySelector('#brand-upsell');
    if (brandUpsell) {
      const pick = business === 'all' ? null : cards
        .filter(card => card.dataset.business !== business)
        .sort((a, b) => Number(b.dataset.score) - Number(a.dataset.score) || Number(b.dataset.liveSales) - Number(a.dataset.liveSales))[0];
      if (!pick) brandUpsell.hidden = true;
      else {
        const name = pick.querySelector('h3')?.textContent || '';
        const brand = pick.querySelector('small')?.textContent || '';
        const price = pick.querySelector('.card-price')?.textContent || '';
        brandUpsell.querySelector('[data-brand-upsell-copy]').textContent = `While you shop ${business}: also trending · ${brand}`;
        const open = brandUpsell.querySelector('[data-brand-upsell-open]');
        open.textContent = `See ${name} · ${price}`;
        open.onclick = () => openDialog(pick, 'brand-upsell', open);
        brandUpsell.hidden = false;
      }
    }
    if (selectionReason) syncFeatured(cards.find(card => !card.hidden), selectionReason);
    return matched;
  };
  search.addEventListener('input', () => {
    visibleLimit = 8;
    const matched = update('search');
    if (search.value.trim().length < 2) searchReported = false;
    if (!searchReported && search.value.trim().length >= 2) {
      searchReported = true;
      report('search_used', { queryLength: Math.min(search.value.trim().length, 100), resultCount: matched });
    }
  });
  sort.addEventListener('change', () => {
    visibleLimit = 8;
    sortManual = true;
    storage.set('hub_sort_manual', '1');
    update('sort');
    report('sort_changed', { sortMode: sort.value, experimentId: experimentIds.sort });
  });
  filters.forEach(button => button.addEventListener('click', () => {
    visibleLimit = 8;
    category = button.dataset.categoryFilter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    update('category');
    report('category_selected', { category });
  }));
  brand?.addEventListener('change', () => {
    visibleLimit = 8;
    business = brand.value || 'all';
    update('business');
    report('brand_selected', { business });
  });
  showMore.addEventListener('click', () => { visibleLimit += 8; update(); showMore.focus(); });
  if (consent) {
    const choice = storage.get('hub_analytics_consent');
    consent.hidden = choice !== null;
    consent.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
      const value = button.dataset.consent;
      storage.set('hub_analytics_consent', value);
      consent.hidden = true;
      if (value === 'granted') startWebVitals();
      if (value === 'granted') { report('hub_view', { productCount: cards.length }); report('view_item_list', { productCount: cards.length }); report('experiment_exposure', { experiment: experimentIds.hero, arm: hubExperience?.hero?.arm, experimentId: experimentIds.hero }); report('experiment_exposure', { experiment: experimentIds.sort, arm: hubExperience?.sort?.arm, experimentId: experimentIds.sort }); report('experiment_exposure', { experiment: experimentIds.rail, arm: hubExperience?.rail?.arm, experimentId: experimentIds.rail }); if(hero&&!hero.hidden)report('hero_viewed',{variant:hero.dataset.heroVariant,selectionReason:hero.dataset.selectionReason||'experiment',sortMode:sort.value,category,experimentId:experimentIds.hero}); }
    }));
    if (choice === 'granted') { startWebVitals(); report('hub_view', { productCount: cards.length }); report('view_item_list', { productCount: cards.length }); report('experiment_exposure', { experiment: experimentIds.hero, arm: hubExperience?.hero?.arm, experimentId: experimentIds.hero }); report('experiment_exposure', { experiment: experimentIds.sort, arm: hubExperience?.sort?.arm, experimentId: experimentIds.sort }); report('experiment_exposure', { experiment: experimentIds.rail, arm: hubExperience?.rail?.arm, experimentId: experimentIds.rail }); if(hero&&!hero.hidden)report('hero_viewed',{variant:hero.dataset.heroVariant,selectionReason:hero.dataset.selectionReason||'experiment',sortMode:sort.value,category,experimentId:experimentIds.hero}); }
  }
  let rankingsRequestInFlight = false;
  const applyRankingRow = (row) => {
    const card = cards.find(item => item.dataset.productName === row.name || item.querySelector('h3')?.textContent === row.name);
    if (!card || !row) return;
    card.dataset.views = String(row.views ?? 0);
    card.dataset.clicks = String(row.clicks ?? 0);
    card.dataset.liveSales = String(row.sales ?? 0);
    card.dataset.score = String(row.score ?? 0);
    card.dataset.rank = String(row.rank ?? 999);
  };
  const refreshRankings = async () => {
    if (document.hidden || rankingsRequestInFlight) return;
    rankingsRequestInFlight = true;
    try {
      const response = await fetch('/hub/rankings', { credentials: 'same-origin' });
      if (!response.ok) return;
      const payload = await response.json();
      if (!Array.isArray(payload.products)) return;
      payload.products.forEach(applyRankingRow);
      if (payload.recommendations && typeof payload.recommendations === 'object') {
        Object.assign(recommendationMap, payload.recommendations);
      }
      refreshRails();
      if (!sortManual) update();
    } catch {} finally { rankingsRequestInFlight = false; }
  };
  let progressRequestInFlight = false;
  const refreshProgress = async () => {
    if (document.hidden || progressRequestInFlight) return;
    progressRequestInFlight = true;
    try {
      const response = await fetch('/hub/progress', { credentials: 'same-origin' });
      if (!response.ok) return;
      const progress = await response.json();
      const revenue = Number(progress.revenueCents);
      const saleCount = Number(progress.saleCount);
      const clickCount = Number(progress.clickCount);
      if (![revenue,saleCount,clickCount].every(value=>Number.isFinite(value)&&value>=0)||typeof progress.latestExternalSale!=='string'&&progress.latestExternalSale!==null)return;
      if(progress.latestSaleAt!==null&&!Number.isFinite(Date.parse(progress.latestSaleAt)))return;
      const percentage = Math.min(100, revenue / 10000000 * 100);
      const latest = document.querySelector('[data-progress-latest]');
      const setText=(selector,value)=>{const element=document.querySelector(selector);if(element&&element.textContent!==value)element.textContent=value;};
      setText('[data-progress-revenue]', `$${(revenue / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
      setText('[data-progress-orders]', `${saleCount.toLocaleString('en-US')} paid orders · ${percentage.toFixed(1)}% of goal. Shipping and tax excluded.${progress.includesOwnerReported ? ' Includes owner-reported sale pending provider receipt reconciliation.' : ''}`);
      setText('[data-progress-meta]', `${clickCount.toLocaleString('en-US')} tracked shop clicks since launch.${progress.latestSaleAt ? ` Latest sale evidence: ${new Date(progress.latestSaleAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}.` : ''}`);
      if (latest) { const latestText=progress.latestExternalSale?`Last sale · ${progress.latestExternalSale}`:''; if(latest.textContent!==latestText)latest.textContent=latestText; latest.hidden=!progress.latestExternalSale; }
      const bar = document.querySelector('[data-progress-bar]');
      bar?.setAttribute('aria-valuenow', String(Math.min(100000, revenue / 100)));
      const fill = bar?.firstElementChild;
      if (fill) { fill.style.width = `${percentage.toFixed(2)}%`; fill.style.minWidth = revenue > 0 ? '4px' : '0'; }
    } catch {} finally { progressRequestInFlight = false; }
  };
  setTimeout(refreshProgress, 15000);
  setInterval(refreshProgress, 30000);
  setTimeout(refreshRankings, 20000);
  setInterval(refreshRankings, 45000);
  if (hubExperience?.sort?.mode && !sortManual && sort.querySelector(`option[value="${hubExperience.sort.mode}"]`)) {
    sort.value = hubExperience.sort.mode;
  }
  window.COMMERCEOS_HUB_CART_VERSION = '2026-08-31-unified-storefront-v3';
  // Direct Hub products resolve into one SMAT Designs LLC Stripe session.
  // Marketplace links remain separate and never enter cart.
  const cartKey = 'commerceos_hub_stripe_cart_v1';
  const cartStyle = document.createElement('style'); cartStyle.textContent = `
    .hub-skip-link{position:fixed;left:12px;top:12px;z-index:1000;transform:translateY(-180%);padding:10px 14px;border-radius:999px;background:#fff;color:#111;font-weight:900}.hub-skip-link:focus{transform:none}
    .hub-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
    .hub-cart-button{position:fixed;right:16px;bottom:16px;z-index:20;border:1px solid #c8ff5b;border-radius:999px;background:#c8ff5b;color:#111;padding:12px 16px;font:inherit;font-size:12px;font-weight:900;box-shadow:0 4px 18px #0008;cursor:pointer}
    body:has(.consent:not([hidden])) .hub-cart-button{bottom:190px}
    .hub-add-cart{margin-top:8px!important;width:100%;border:1px solid #555;cursor:pointer}
    .hub-cart-dialog{border:1px solid #555;border-radius:18px;background:#151515;color:#fff;padding:0;max-width:calc(100vw - 24px);width:min(480px,calc(100vw - 24px));max-height:min(88vh,720px);overflow:hidden;box-shadow:0 20px 70px #000c;box-sizing:border-box}
    .hub-cart-dialog::backdrop{background:#0009}
    .hub-cart-panel{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:12px;padding:18px;max-height:min(88vh,720px);box-sizing:border-box}
    .hub-cart-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .hub-cart-head h2{margin:0;font-size:22px;line-height:1.1}
    .hub-cart-count{color:#b8f8c8;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
    .hub-cart-close{border:1px solid #444;border-radius:999px;background:#111;color:#fff;padding:9px 12px;font-size:12px;font-weight:900;cursor:pointer}
    .hub-cart-summary{display:grid;gap:8px;padding:12px 14px;border:1px solid #2d2d2d;border-radius:16px;background:#101010}
    .hub-cart-summary strong{font-size:14px}
    .hub-cart-summary span{color:#aaa;font-size:12px;line-height:1.4}
    .hub-cart-list{display:grid;align-content:start;gap:10px;overflow:auto;padding-right:2px;min-height:0}
    .hub-cart-item{display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;align-items:start;padding:12px;border:1px solid #2f2f2f;border-radius:16px;background:#111}
    .hub-cart-item img,.hub-cart-thumb-fallback{width:64px;height:64px;object-fit:contain;object-position:center;background:#f3efe6;border-radius:12px;padding:5px;box-sizing:border-box}
    .hub-cart-item-main{display:grid;gap:9px;min-width:0}
    .hub-cart-item-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .hub-cart-item-title strong{display:block;font-size:14px;line-height:1.2;overflow-wrap:anywhere}
    .hub-cart-line-total{white-space:nowrap;color:#fff;font-size:13px;font-weight:900}
    .hub-cart-item-meta{display:flex;flex-wrap:wrap;gap:6px 10px;color:#aaa;font-size:11px;line-height:1.2}
    .hub-cart-item-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;min-width:0}
    .hub-cart-qty{display:inline-grid;grid-template-columns:34px 34px 34px;overflow:hidden;border:1px solid #3a3a3a;border-radius:999px;background:#151515}
    .hub-cart-qty button{min-height:34px;border:0;border-right:1px solid #2b2b2b;background:#1f1f1f;color:#fff;font-size:16px;font-weight:900;cursor:pointer}
    .hub-cart-qty button:last-child{border-right:0;border-left:1px solid #2b2b2b}
    .hub-cart-qty span,.hub-cart-qty output{display:grid;place-items:center;font-size:12px;font-weight:900}
    .hub-cart-item-buttons{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px;min-width:0}
    .hub-cart-item-checkout{min-height:34px;padding:0 10px;border:1px solid #555;border-radius:999px;background:#222;color:#fff;font-size:11px;font-weight:900;text-decoration:none;display:inline-grid;place-items:center}
    .hub-cart-item-included{font-size:11px;color:#aaa;font-weight:800}
    .hub-cart-remove{min-height:34px;padding:0 10px;border:1px solid #444;border-radius:999px;background:#191919;color:#ddd;font-size:11px;font-weight:900;cursor:pointer}
    .hub-cart-footer{position:sticky;bottom:-18px;display:grid;gap:10px;margin:0 -18px -18px;padding:12px 18px 18px;border-top:1px solid #2d2d2d;background:#151515}
    .hub-cart-total-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;color:#aaa}
    .hub-cart-total-row strong{color:#fff;font-size:18px}
    .hub-central-checkout{display:block;width:100%;min-height:52px;border:0;border-radius:14px;background:#c8ff5b;color:#111;font-weight:900;cursor:pointer}
    .hub-central-checkout:disabled{opacity:.6;cursor:wait}
    .hub-cart-trust{margin:0;color:#aaa;font-size:11px;line-height:1.35;text-align:center}
    .hub-cart-clear{display:block;width:100%;min-height:40px;border:1px solid #444;border-radius:14px;background:#111;color:#fff;font-weight:900;cursor:pointer}
    .hub-cart-error{color:#ffb4b4;font-size:12px;line-height:1.4}
    .hub-cart-empty{padding:4px 2px 2px;color:#aaa;font-size:13px}
    @media (max-width:620px){.hub-cart-dialog{width:calc(100vw - 16px);max-width:calc(100vw - 16px);max-height:calc(100dvh - 24px);border-radius:20px}.hub-cart-panel{padding:14px;max-height:calc(100dvh - 24px);overflow-x:hidden}.hub-cart-head{gap:8px}.hub-cart-head h2{font-size:clamp(20px,7vw,28px)}.hub-cart-summary{padding:11px 12px}.hub-cart-item{grid-template-columns:56px minmax(0,1fr);gap:9px;padding:10px;min-width:0;overflow:hidden}.hub-cart-item img,.hub-cart-thumb-fallback{width:56px;height:56px}.hub-cart-item-actions{grid-template-columns:1fr;align-items:stretch;gap:8px}.hub-cart-item-buttons{width:100%;grid-template-columns:minmax(0,1fr) auto}.hub-cart-item-checkout,.hub-cart-remove{min-width:0}.hub-cart-footer{margin:0 -14px -14px;padding:11px 14px 14px}.hub-cart-total-row strong{font-size:20px}.hub-central-checkout{min-height:52px;font-size:14px}}
  `; document.head.appendChild(cartStyle);
  let cartMemoryRaw = '[]';
  const getCartRaw = () => {
    try {
      const stored = localStorage.getItem(cartKey);
      if (stored !== null) {
        cartMemoryRaw = stored;
        return stored;
      }
    } catch {}
    return cartMemoryRaw;
  };
  const setCartRaw = value => {
    cartMemoryRaw = value;
    try { localStorage.setItem(cartKey, value); } catch {}
  };
  const checkoutReturn = new URLSearchParams(location.search).get('checkout');
  if (checkoutReturn === 'success' || checkoutReturn === 'cancelled') {
    const notice = document.createElement('aside');
    notice.className = `hub-checkout-return hub-checkout-return--${checkoutReturn}`;
    notice.setAttribute('role', 'status');
    notice.innerHTML = checkoutReturn === 'success'
      ? '<strong>Confirming payment</strong><span>Keep this page open while we verify your order.</span>'
      : '<strong>Checkout canceled</strong><span>Your cart is saved. Continue when ready.</span>';
    document.querySelector('.intro')?.insertAdjacentElement('afterend', notice);
    if (checkoutReturn === 'success') {
      const sessionId = new URLSearchParams(location.search).get('session_id') || '';
      fetch(`/hub/cart/checkout/status?session_id=${encodeURIComponent(sessionId)}`, { credentials: 'same-origin', headers: { accept: 'application/json' } })
        .then(async response => ({ response, data: await response.json().catch(() => ({})) }))
        .then(({ response, data }) => {
          if (response.ok && data?.paid === true) {
            setCartRaw('[]');
            try { sessionStorage.removeItem('hub_checkout_attempt'); sessionStorage.removeItem('hub_buy_now_attempt'); } catch {}
            notice.innerHTML = '<strong>Payment confirmed</strong><span>Order details and receipt will arrive by email.</span>';
            renderCart();
          } else {
            notice.innerHTML = '<strong>Payment processing</strong><span>Your cart stays saved until payment confirmation arrives.</span>';
          }
        })
        .catch(() => { notice.innerHTML = '<strong>Payment confirmation pending</strong><span>Your cart stays saved. Order details will arrive by email.</span>'; });
    }
    const clean = new URL(document.URL); clean.searchParams.delete('checkout'); clean.searchParams.delete('session_id'); history.replaceState(history.state, '', `${clean.pathname}${clean.search}${clean.hash}`);
  }
  const cartSafeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeHubBuyHref = value => {
    try {
      const url = new URL(String(value || ''), location.origin);
      if (url.origin !== location.origin || !url.pathname.startsWith('/hub/buy/')) return '#';
      return `${url.pathname}${url.search}${url.hash}`;
    } catch { return '#'; }
  };
  const cartMetrics = items => ({
    cartSize: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    distinctItemCount: items.length,
    subtotal: items.reduce((sum, item) => sum + Math.max(0, Number(item.unitCents || 0)) * Math.max(1, Number(item.quantity || 1)), 0),
  });
  const isCentralReadyItem = item => /^(?:variant|destination):[a-z0-9:_-]+$/.test(item.catalogLineId || '')
    && /^price_[A-Za-z0-9]+$/.test(item.sourcePriceId || '')
    && Number(item.unitCents) > 0;
  const findCartProduct = item => {
    const catalogLineId = String(item?.catalogLineId || '');
    if (catalogLineId) {
      const link = document.querySelector(`a[data-catalog-line-id="${CSS.escape(catalogLineId)}"]`);
      if (link) return { product: link.closest('[data-product]'), link };
    }
    const href = String(item?.href || '');
    if (href) {
      const slug = (() => { try { return new URL(href, location.origin).pathname.split('/hub/buy/')[1] || ''; } catch { return ''; } })();
      if (slug) {
        const link = [...document.querySelectorAll('article[data-product] a.buy.primary.direct')].find(anchor => {
          try { return new URL(anchor.href, location.origin).pathname.endsWith(`/hub/buy/${slug}`); } catch { return false; }
        });
        if (link) return { product: link.closest('[data-product]'), link };
      }
    }
    const sourcePriceId = String(item?.sourcePriceId || '');
    if (sourcePriceId) {
      const matches = [...document.querySelectorAll(`a[data-source-price-id="${CSS.escape(sourcePriceId)}"]`)];
      if (matches.length === 1) return { product: matches[0].closest('[data-product]'), link: matches[0] };
      // Shared source prices cannot prove a color/variant identity. Keep legacy
      // line unready until shopper reselects it instead of silently changing it.
      if (matches.length > 1) return { product: null, link: null };
    }
    const name = String(item?.name || '').trim();
    if (name) {
      const product = cards.find(card => card.dataset.productName === name || card.querySelector('h3')?.textContent?.trim() === name);
      if (product) return { product, link: product.querySelector('a.buy.primary.direct') };
    }
    return { product: null, link: null };
  };
  const normalizeCartItem = item => {
    const { product, link } = findCartProduct(item);
    const quantity = Math.min(HUB_QTY_MAX, Math.max(1, Math.floor(Number(item?.quantity || 1))));
    const sourcePriceId = String(item?.sourcePriceId || link?.getAttribute('data-source-price-id') || '');
    const catalogLineId = String(item?.catalogLineId || link?.getAttribute('data-catalog-line-id') || '');
    const unitCents = Number(item?.unitCents || link?.getAttribute('data-unit-cents') || product?.dataset?.price * 100 || 0);
    return {
      href: safeHubBuyHref(item?.href || link?.href || '#'),
      sourcePriceId,
      catalogLineId,
      name: String(item?.name || product?.getAttribute('data-product-name') || product?.querySelector('h3')?.textContent || 'Product'),
      thumb: String(item?.thumb || product?.querySelector('img')?.getAttribute('src') || ''),
      unitCents: Number.isFinite(unitCents) && unitCents > 0 ? Math.round(unitCents) : 0,
      quantity,
      business: String(item?.business || product?.getAttribute('data-business') || product?.querySelector('small')?.textContent || ''),
      category: String(item?.category || product?.getAttribute('data-category') || ''),
      variantName: String(item?.variantName || link?.getAttribute('data-variant-label') || ''),
      sku: String(item?.sku || link?.getAttribute('data-variant-sku') || ''),
    };
  };
  const readCart = () => {
    try {
      const value = JSON.parse(getCartRaw() || '[]');
      return Array.isArray(value) ? value.map(normalizeCartItem).filter(item => item.href !== '#' && item.name) : [];
    } catch { return []; }
  };
  const writeCart = (items) => { setCartRaw(JSON.stringify(items.slice(0, 20))); renderCart(); };
  const renderCart = () => { const items = readCart(); const count = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0); const subtotal = items.reduce((sum, item) => sum + Number(item.unitCents || 0) * Number(item.quantity || 1), 0); let button = document.getElementById('hub-cart-button'); if (!button) { button = document.createElement('button'); button.id = 'hub-cart-button'; button.type = 'button'; button.className = 'hub-cart-button'; document.body.appendChild(button); } button.setAttribute('aria-label', `Open cart, ${count} item${count === 1 ? '' : 's'}, ${formatMoney(subtotal)}`); button.textContent = count ? `Cart · ${count} · ${formatMoney(subtotal)}` : 'Cart · Empty'; };
  const bindAddToCartLink = (link) => {
    if (!(link instanceof HTMLAnchorElement) || link.dataset.cartBound === '1' || !link.dataset.catalogLineId || !link.dataset.sourcePriceId) return;
    link.dataset.cartBound = '1';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'buy secondary hub-add-cart';
    add.textContent = 'Add to cart';
    const optionLabel = link.dataset.variantLabel || link.textContent?.trim() || 'item';
    add.setAttribute('aria-label', `Add ${optionLabel} to cart`);
    add.addEventListener('click', () => {
      const items = readCart();
      const product = link.closest('[data-product], .featured, .product-dialog');
      const quantity = readQty(product || document);
      const sourcePriceId = link.dataset.sourcePriceId || '';
      const catalogLineId = link.dataset.catalogLineId || '';
      const thumb = product?.dataset.productThumb || product?.querySelector('img')?.getAttribute('src') || '';
      const unitCents = Number(link.dataset.unitCents || 0);
      const name = product?.dataset.productName || 'Product';
      const businessName = product?.dataset.business || '';
      const variantName = link.dataset.variantLabel || '';
      const sku = link.dataset.variantSku || '';
      const existing = items.find(item => catalogLineId && item.catalogLineId === catalogLineId);
      if (existing) existing.quantity = Math.min(HUB_QTY_MAX, Number(existing.quantity || 1) + quantity);
      else items.push({ href: link.href, sourcePriceId, catalogLineId, name, thumb, unitCents, quantity, business: businessName, category: product?.dataset.category || '', variantName, sku });
      writeCart(items);
      const metrics = cartMetrics(items);
      report('add_to_cart', { product: name, business: businessName, sourcePriceId, catalogLineId, variantName, sku, quantity, value: unitCents * quantity / 100, cartSize: metrics.cartSize, distinctItemCount: metrics.distinctItemCount });
      add.textContent = `Added ${quantity}`;
      liveStatus.textContent = `${quantity} ${name}${variantName ? `, ${variantName}` : ''} added to cart.`;
      setTimeout(() => { add.textContent = 'Add to cart'; }, 1200);
    });
    const detailList = link.closest('.dialog-more-buy-list');
    if (detailList) {
      const row = document.createElement('div');
      row.className = 'dialog-buy-option';
      link.insertAdjacentElement('beforebegin', row);
      row.append(link, add);
    } else link.insertAdjacentElement('afterend', add);
  };
  const bindCentralBuyNowLink = (link) => {
    if (!(link instanceof HTMLAnchorElement) || link.dataset.centralBuyBound === '1' || !link.dataset.catalogLineId || !link.dataset.sourcePriceId) return;
    link.dataset.centralBuyBound = '1';
    link.addEventListener('click', async event => {
      event.preventDefault();
      if (link.getAttribute('aria-busy') === 'true') return;
      const product = link.closest('[data-product], .featured, .product-dialog');
      const quantity = readQty(product || document);
      const catalogLineId = link.dataset.catalogLineId || '';
      const sourcePriceId = link.dataset.sourcePriceId || '';
      const attemptCart = `${catalogLineId}:${quantity}`;
      const checkoutAttemptId = (() => {
        try {
          const stored = JSON.parse(sessionStorage.getItem('hub_buy_now_attempt') || 'null');
          if (stored?.cart === attemptCart && /^[0-9a-f-]{36}$/i.test(stored?.id || '')) return stored.id;
          const id = crypto.randomUUID(); sessionStorage.setItem('hub_buy_now_attempt', JSON.stringify({ cart: attemptCart, id })); return id;
        } catch { return crypto.randomUUID(); }
      })();
      const previous = link.textContent;
      link.setAttribute('aria-busy', 'true'); link.textContent = 'Preparing secure checkout…';
      report('begin_checkout', { quantity, value: Number(link.dataset.unitCents || 0) * quantity / 100, cartSize: quantity, distinctItemCount: 1, catalogLineId, sourcePriceId });
      try {
        const response = await fetch('/hub/cart/checkout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ catalogLineId, sourcePriceId, quantity }], checkoutAttemptId, sourcePlatform, experiments: { hero: hubExperience?.hero, sort: hubExperience?.sort, rail: hubExperience?.rail } }) });
        const result = await response.json();
        if (!response.ok || !result.url) throw new Error(result.error || 'checkout_failed');
        try { sessionStorage.removeItem('hub_buy_now_attempt'); } catch {}
        window.location.assign(result.url);
      } catch (error) {
        link.removeAttribute('aria-busy'); link.textContent = previous || 'Buy now';
        const code = error instanceof Error ? error.message : 'checkout_unavailable';
        liveStatus.textContent = 'Secure checkout could not open. Try again.';
        report('checkout_error', { quantity, cartSize: quantity, distinctItemCount: 1, catalogLineId, sourcePriceId, errorCode: code });
      }
    });
  };
  const bindAddToCartLinks = (scope) => scope.querySelectorAll('a[data-buy-direct]').forEach(link => { bindAddToCartLink(link); bindCentralBuyNowLink(link); });
  const cartDialogMarkup = (items, metrics, centralReady) => `<form method="dialog" class="hub-cart-panel">
    <div class="hub-cart-head"><div><div class="hub-cart-count">${metrics.cartSize} item${metrics.cartSize === 1 ? '' : 's'}</div><h2 id="hub-cart-title">Your cart</h2></div><button value="close" class="hub-cart-close" aria-label="Close cart">Continue shopping</button></div>
    <div class="hub-cart-summary"><strong>${items.length ? 'Review your picks' : 'Cart is empty'}</strong><span>${items.length ? 'Items stay editable here. Checkout opens secure Stripe payment for direct Hub items.' : 'Add items from hub to see them here.'}</span></div>
    ${items.length ? `<ul class="hub-cart-list">${items.map((item, index) => {
      const lineTotal = Math.max(0, Number(item.unitCents || 0)) * Math.max(1, Number(item.quantity || 1));
      const quantityLabelId = `hub-cart-qty-label-${index}`;
      return `<li class="hub-cart-item" data-cart-line="${index}">${item.thumb ? `<img src="${cartSafeText(item.thumb)}" alt="" loading="lazy" decoding="async">` : '<div class="hub-cart-thumb-fallback" aria-hidden="true"></div>'}<div class="hub-cart-item-main"><div class="hub-cart-item-title"><strong>${cartSafeText(item.name)}</strong>${lineTotal ? `<span class="hub-cart-line-total">$${(lineTotal / 100).toFixed(2)}</span>` : ''}</div><div class="hub-cart-item-meta"><span>${cartSafeText(item.business || 'Direct')}</span>${item.variantName ? `<span>${cartSafeText(item.variantName)}</span>` : ''}${item.unitCents ? `<span>$${(Number(item.unitCents) / 100).toFixed(2)} each</span>` : ''}</div><div class="hub-cart-item-actions"><span class="hub-cart-qty" role="group" aria-labelledby="${quantityLabelId}"><span class="hub-sr-only" id="${quantityLabelId}">Quantity for ${cartSafeText(item.name)}</span><button type="button" data-cart-dec="${index}" aria-label="Decrease ${cartSafeText(item.name)} quantity">−</button><output data-cart-qty-output="${index}" aria-live="polite">${cartSafeText(item.quantity)}</output><button type="button" data-cart-inc="${index}" aria-label="Increase ${cartSafeText(item.name)} quantity">+</button></span><span class="hub-cart-item-buttons"><span class="hub-cart-item-included">Included above</span><button class="hub-cart-remove" type="button" data-cart-remove="${index}" aria-label="Remove ${cartSafeText(item.name)}">Remove</button></span></div></div></li>`;
    }).join('')}</ul>` : '<p class="hub-cart-empty">Your cart is empty.</p>'}
    ${items.length ? `<div class="hub-cart-footer"><div class="hub-cart-total-row"><span>Subtotal</span><strong>$${(metrics.subtotal / 100).toFixed(2)}</strong></div>${centralReady ? '<button type="button" class="hub-central-checkout">Checkout all in one payment</button><p class="hub-cart-trust">Secure Stripe checkout. Shipping and tax calculated next.</p>' : '<p class="hub-cart-error">Some saved items need variant confirmation. Remove and add them again before unified checkout.</p>'}<button type="button" class="hub-cart-clear">Clear cart</button></div>` : ''}
  </form>`;
  cards.forEach(card => bindAddToCartLinks(card));
  if (hero) bindAddToCartLinks(hero);
  renderCart();
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.id !== 'hub-cart-button') return;
    event.preventDefault(); event.stopImmediatePropagation();
    const cartDialog = document.createElement('dialog');
    cartDialog.className = 'hub-cart-dialog';
    const updateCartDialog = (focusSelector = null) => {
      const items = readCart();
      const metrics = cartMetrics(items);
      const centralReady = items.length > 0 && items.every(isCentralReadyItem);
      cartDialog.classList.toggle('hub-cart-dialog--fallback', items.length > 0 && !centralReady);
      cartDialog.innerHTML = cartDialogMarkup(items, metrics, centralReady);
      cartDialog.setAttribute('aria-labelledby', 'hub-cart-title');
      const refresh = (nextFocusSelector = focusSelector) => updateCartDialog(nextFocusSelector);
      cartDialog.querySelectorAll('[data-cart-remove]').forEach(remove => remove.addEventListener('click', () => {
        const index = Number(remove.getAttribute('data-cart-remove'));
        const next = readCart();
        const removed = next[index];
        next.splice(index, 1);
        writeCart(next);
        const nextMetrics = cartMetrics(next);
        report('remove_from_cart', { product: removed?.name, business: removed?.business, sourcePriceId: removed?.sourcePriceId, catalogLineId: removed?.catalogLineId, variantName: removed?.variantName, sku: removed?.sku, quantity: removed?.quantity, value: Number(removed?.unitCents || 0) * Number(removed?.quantity || 1) / 100, cartSize: nextMetrics.cartSize, distinctItemCount: nextMetrics.distinctItemCount });
        refresh(next.length ? `[data-cart-remove="${Math.min(index, next.length - 1)}"]` : '.hub-cart-close');
      }));
      const changeQuantity = (button, delta) => {
        const index = Number(button.getAttribute(delta < 0 ? 'data-cart-dec' : 'data-cart-inc'));
        const next = readCart();
        if (!next[index]) return;
        next[index].quantity = Math.min(HUB_QTY_MAX, Math.max(1, Number(next[index].quantity || 1) + delta));
        writeCart(next);
        const nextMetrics = cartMetrics(next);
        report('quantity_changed', { product: next[index].name, business: next[index].business, sourcePriceId: next[index].sourcePriceId, catalogLineId: next[index].catalogLineId, variantName: next[index].variantName, sku: next[index].sku, quantity: next[index].quantity, value: Number(next[index].unitCents || 0) * next[index].quantity / 100, cartSize: nextMetrics.cartSize, distinctItemCount: nextMetrics.distinctItemCount });
        const attribute = delta < 0 ? 'data-cart-dec' : 'data-cart-inc';
        refresh(`[${attribute}="${index}"]`);
      };
      cartDialog.querySelectorAll('[data-cart-dec]').forEach(button => button.addEventListener('click', () => changeQuantity(button, -1)));
      cartDialog.querySelectorAll('[data-cart-inc]').forEach(button => button.addEventListener('click', () => changeQuantity(button, 1)));
      cartDialog.querySelector('.hub-cart-clear')?.addEventListener('click', () => { writeCart([]); refresh('.hub-cart-close'); liveStatus.textContent = 'Cart cleared.'; });
      const central = cartDialog.querySelector('.hub-central-checkout');
      central?.addEventListener('click', async () => {
        const checkoutItems = readCart();
        const checkoutMetrics = cartMetrics(checkoutItems);
        central.disabled = true;
        central.textContent = 'Preparing secure checkout…';
        report('begin_checkout', { quantity: checkoutMetrics.cartSize, value: checkoutMetrics.subtotal / 100, cartSize: checkoutMetrics.cartSize, distinctItemCount: checkoutMetrics.distinctItemCount });
        const attemptCart = checkoutItems.map(item => `${item.catalogLineId}:${item.quantity}`).sort().join('|');
        const checkoutAttemptId = (() => { try { const stored = JSON.parse(sessionStorage.getItem('hub_checkout_attempt') || 'null'); if (stored?.cart === attemptCart && /^[0-9a-f-]{36}$/i.test(stored?.id || '')) return stored.id; const id = crypto.randomUUID(); sessionStorage.setItem('hub_checkout_attempt', JSON.stringify({ cart: attemptCart, id })); return id; } catch { return crypto.randomUUID(); } })();
        try {
          const response = await fetch('/hub/cart/checkout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: checkoutItems.map(item => ({ catalogLineId: item.catalogLineId, sourcePriceId: item.sourcePriceId, quantity: item.quantity })), checkoutAttemptId, sourcePlatform, experiments: { hero: hubExperience?.hero, sort: hubExperience?.sort, rail: hubExperience?.rail } }) });
          const result = await response.json();
          if (!response.ok || !result.url) throw new Error(result.error || 'checkout_failed');
          try { sessionStorage.removeItem('hub_checkout_attempt'); } catch {}
          window.location.assign(result.url);
        } catch (error) {
          const code = error instanceof Error ? error.message : 'checkout_unavailable';
          report('checkout_error', { quantity: checkoutMetrics.cartSize, value: checkoutMetrics.subtotal / 100, cartSize: checkoutMetrics.cartSize, distinctItemCount: checkoutMetrics.distinctItemCount, errorCode: code });
          const message = document.createElement('p'); message.className = 'hub-cart-error'; message.setAttribute('role', 'alert'); message.textContent = 'Secure checkout could not open. Your cart is saved. Try again.'; central.insertAdjacentElement('afterend', message); central.disabled = false; central.textContent = 'Checkout all in one payment';
        }
      });
      if (focusSelector) requestAnimationFrame(() => { const focusTarget = cartDialog.querySelector(focusSelector); focusTarget?.focus(); });
    };
    const initialItems = readCart();
    const initialMetrics = cartMetrics(initialItems);
    report('view_cart', { quantity: initialMetrics.cartSize, value: initialMetrics.subtotal / 100, cartSize: initialMetrics.cartSize, distinctItemCount: initialMetrics.distinctItemCount });
    updateCartDialog();
    document.body.appendChild(cartDialog); cartDialog.showModal();
    cartDialog.addEventListener('close', () => cartDialog.remove(), { once: true });
  }, true);
  update();
})();
