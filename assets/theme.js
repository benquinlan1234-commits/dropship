/* PDRN Orb Serum — theme scripts. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var strings = window.themeStrings || {};
  var settings = window.themeSettings || {};

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ----------------------------------------------------------------------
     Cart API
     ---------------------------------------------------------------------- */

  var Cart = {
    routes: {
      add: '/cart/add.js',
      change: '/cart/change.js',
      get: '/cart.js'
    },

    add: function (body) {
      return fetch(this.routes.add, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      }).then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.description || strings.addError);
          return data;
        });
      });
    },

    change: function (body) {
      return fetch(this.routes.change, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      }).then(function (response) {
        if (!response.ok) throw new Error(strings.updateError);
        return response.json();
      });
    },

    get: function () {
      return fetch(this.routes.get, { headers: { Accept: 'application/json' } }).then(function (r) {
        return r.json();
      });
    },

    /* Re-renders the cart drawer markup through the Section Rendering API. */
    refresh: function () {
      return fetch(window.Shopify && window.Shopify.routes && window.Shopify.routes.root
        ? window.Shopify.routes.root + '?sections=cart-drawer'
        : '/?sections=cart-drawer')
        .then(function (response) {
          return response.json();
        })
        .then(function (sections) {
          var html = sections['cart-drawer'];
          if (!html) return;
          var parsed = new DOMParser().parseFromString(html, 'text/html');
          var fresh = parsed.querySelector('cart-drawer');
          var current = document.querySelector('cart-drawer');
          if (fresh && current) {
            current.innerHTML = fresh.innerHTML;
            current.dataset.count = fresh.dataset.count || '0';
          }
          document.dispatchEvent(
            new CustomEvent('cart:updated', { detail: { count: fresh ? fresh.dataset.count : '0' } })
          );
        });
    }
  };

  window.themeCart = Cart;

  /* ----------------------------------------------------------------------
     Cart drawer
     ---------------------------------------------------------------------- */

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.addEventListener('click', this.handleClick.bind(this));
      this.addEventListener('change', this.handleChange.bind(this));
      document.addEventListener('keydown', this.handleKeydown.bind(this));
      document.addEventListener('cart:open', this.open.bind(this));
    }

    handleClick(event) {
      var closeTrigger = event.target.closest('[data-cart-close], [data-cart-overlay]');
      if (closeTrigger) {
        event.preventDefault();
        this.close();
        return;
      }

      var qtyButton = event.target.closest('[data-quantity-change]');
      if (qtyButton) {
        event.preventDefault();
        var line = qtyButton.closest('[data-line]');
        if (!line) return;
        var next = parseInt(qtyButton.dataset.quantityChange, 10);
        this.updateLine(parseInt(line.dataset.line, 10), next);
        return;
      }

      var removeButton = event.target.closest('[data-cart-remove]');
      if (removeButton) {
        event.preventDefault();
        var lineEl = removeButton.closest('[data-line]');
        if (lineEl) this.updateLine(parseInt(lineEl.dataset.line, 10), 0);
      }
    }

    handleChange(event) {
      var input = event.target.closest('[data-quantity-input]');
      if (!input) return;
      var line = input.closest('[data-line]');
      if (!line) return;
      this.updateLine(parseInt(line.dataset.line, 10), parseInt(input.value, 10));
    }

    handleKeydown(event) {
      if (!this.hasAttribute('open')) return;
      if (event.key === 'Escape') {
        this.close();
        return;
      }
      if (event.key === 'Tab') this.trapFocus(event);
    }

    trapFocus(event) {
      var panel = this.querySelector('[data-cart-panel]');
      if (!panel) return;
      var items = Array.prototype.slice.call(panel.querySelectorAll(FOCUSABLE)).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    updateLine(line, quantity) {
      if (isNaN(line) || isNaN(quantity) || quantity < 0) return;
      this.setBusy(true);
      Cart.change({ line: line, quantity: quantity })
        .then(function () {
          return Cart.refresh();
        })
        .catch(function (error) {
          this.showError(error.message);
        }.bind(this))
        .then(function () {
          this.setBusy(false);
        }.bind(this));
    }

    setBusy(state) {
      this.toggleAttribute('aria-busy', state);
      this.classList.toggle('is-busy', state);
    }

    showError(message) {
      var target = this.querySelector('[data-cart-error]');
      if (!target) return;
      target.textContent = message || strings.updateError || '';
      target.hidden = !message;
    }

    open() {
      this.lastFocused = document.activeElement;
      this.setAttribute('open', '');
      document.body.classList.add('drawer-open');
      var panel = this.querySelector('[data-cart-panel]');
      window.requestAnimationFrame(function () {
        var focusTarget = this.querySelector('[data-cart-close]') || panel;
        if (focusTarget) focusTarget.focus();
      }.bind(this));
    }

    close() {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      document.body.classList.remove('drawer-open');
      if (this.lastFocused && typeof this.lastFocused.focus === 'function') this.lastFocused.focus();
    }
  }

  customElements.define('cart-drawer', CartDrawer);

  /* ----------------------------------------------------------------------
     Add to cart forms
     ---------------------------------------------------------------------- */

  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;
      this.button = this.querySelector('[type="submit"]');
      this.form.addEventListener('submit', this.onSubmit.bind(this));
    }

    onSubmit(event) {
      event.preventDefault();
      if (!this.button || this.button.hasAttribute('disabled')) return;

      var formData = new FormData(this.form);
      var payload = { items: [] };
      var item = {
        id: formData.get('id'),
        quantity: parseInt(formData.get('quantity') || '1', 10)
      };
      var sellingPlan = formData.get('selling_plan');
      if (sellingPlan) item.selling_plan = sellingPlan;
      payload.items.push(item);

      this.setLoading(true);
      this.setError('');

      Cart.add(payload)
        .then(function () {
          return Cart.refresh();
        })
        .then(function () {
          document.dispatchEvent(new CustomEvent('cart:open'));
        })
        .catch(
          function (error) {
            this.setError(error.message || strings.addError);
          }.bind(this)
        )
        .then(
          function () {
            this.setLoading(false);
          }.bind(this)
        );
    }

    setLoading(state) {
      if (!this.button) return;
      this.button.classList.toggle('is-loading', state);
      this.button.toggleAttribute('aria-disabled', state);
      var label = this.button.querySelector('[data-button-label]');
      if (!label) return;
      if (state) {
        this.defaultLabel = label.textContent;
        label.textContent = strings.adding || label.textContent;
      } else if (this.defaultLabel) {
        label.textContent = this.defaultLabel;
      }
    }

    setError(message) {
      var target = this.querySelector('[data-form-error]');
      if (!target) return;
      target.textContent = message || '';
      target.hidden = !message;
    }
  }

  customElements.define('product-form', ProductForm);

  /* ----------------------------------------------------------------------
     Bundle selector — swaps variant + selling plan across the page
     ---------------------------------------------------------------------- */

  class BundleSelector extends HTMLElement {
    connectedCallback() {
      this.inputs = Array.prototype.slice.call(this.querySelectorAll('[data-bundle-option]'));
      this.variantInput = this.querySelector('[data-variant-input]');
      this.sellingPlanInput = this.querySelector('[data-selling-plan-input]');
      this.subscribeToggle = this.querySelector('[data-subscribe-toggle]');

      this.inputs.forEach(
        function (input) {
          input.addEventListener('change', this.onSelect.bind(this));
        }.bind(this)
      );

      if (this.subscribeToggle) this.subscribeToggle.addEventListener('change', this.onSelect.bind(this));

      this.onSelect();
    }

    get selected() {
      return this.inputs.filter(function (input) {
        return input.checked;
      })[0];
    }

    onSelect() {
      var option = this.selected;
      if (!option) return;

      var card = option.closest('[data-bundle-card]');
      this.querySelectorAll('[data-bundle-card]').forEach(function (el) {
        el.classList.toggle('is-selected', el === card);
      });

      var subscribing = !!(this.subscribeToggle && this.subscribeToggle.checked);
      var sellingPlan = option.dataset.sellingPlan || '';

      if (this.variantInput) this.variantInput.value = option.value;
      if (this.sellingPlanInput) this.sellingPlanInput.value = subscribing ? sellingPlan : '';

      this.querySelectorAll('[data-price-onetime]').forEach(function (el) {
        el.hidden = subscribing;
      });
      this.querySelectorAll('[data-price-subscription]').forEach(function (el) {
        el.hidden = !subscribing;
      });

      document.dispatchEvent(
        new CustomEvent('variant:change', {
          detail: {
            variantId: option.value,
            sellingPlan: subscribing ? sellingPlan : '',
            label: option.dataset.label || '',
            price: option.dataset.price || '',
            subscribing: subscribing
          }
        })
      );
    }
  }

  customElements.define('bundle-selector', BundleSelector);

  /* ----------------------------------------------------------------------
     Sticky add-to-cart bar
     ---------------------------------------------------------------------- */

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      this.trigger = document.querySelector('[data-sticky-trigger]');
      this.select = this.querySelector('[data-sticky-variant]');
      this.variantInput = this.querySelector('[data-variant-input]');
      this.priceTargets = Array.prototype.slice.call(this.querySelectorAll('[data-sticky-price]'));

      if (this.select) {
        this.select.addEventListener(
          'change',
          function () {
            this.syncFromSelect();
          }.bind(this)
        );
      }

      document.addEventListener('variant:change', this.onVariantChange.bind(this));

      if (this.trigger && 'IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          function (entries) {
            this.classList.toggle('is-visible', !entries[0].isIntersecting);
          }.bind(this),
          { rootMargin: '0px 0px -85% 0px' }
        );
        this.observer.observe(this.trigger);
      } else {
        this.classList.add('is-visible');
      }
    }

    syncFromSelect() {
      var option = this.select.options[this.select.selectedIndex];
      if (!option) return;
      if (this.variantInput) this.variantInput.value = option.value;
      this.setPrice(option.dataset.price || '');
    }

    onVariantChange(event) {
      var detail = event.detail || {};
      if (this.select && detail.variantId) {
        Array.prototype.forEach.call(this.select.options, function (option) {
          option.selected = option.value === String(detail.variantId);
        });
      }
      if (this.variantInput && detail.variantId) this.variantInput.value = detail.variantId;
      if (detail.price) this.setPrice(detail.price);
      var planInput = this.querySelector('[data-selling-plan-input]');
      if (planInput) planInput.value = detail.sellingPlan || '';
    }

    setPrice(html) {
      if (!html) return;
      this.priceTargets.forEach(function (el) {
        el.innerHTML = html;
      });
    }
  }

  customElements.define('sticky-atc', StickyAtc);

  /* ----------------------------------------------------------------------
     Media gallery (product hero)
     ---------------------------------------------------------------------- */

  class MediaGallery extends HTMLElement {
    connectedCallback() {
      this.viewer = this.querySelector('[data-gallery-viewer]');
      this.thumbs = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-thumb]'));
      this.thumbs.forEach(
        function (thumb) {
          thumb.addEventListener('click', this.onThumbClick.bind(this));
        }.bind(this)
      );
    }

    onThumbClick(event) {
      var thumb = event.currentTarget;
      var index = thumb.dataset.galleryThumb;
      var slide = this.querySelector('[data-gallery-slide="' + index + '"]');
      if (slide && this.viewer) {
        this.viewer.scrollTo({ left: slide.offsetLeft - this.viewer.offsetLeft, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
      }
      this.thumbs.forEach(function (el) {
        el.setAttribute('aria-current', el === thumb ? 'true' : 'false');
      });
    }
  }

  customElements.define('media-gallery', MediaGallery);

  /* ----------------------------------------------------------------------
     Horizontal scroller controls (results gallery, reviews)
     ---------------------------------------------------------------------- */

  class ScrollCarousel extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-carousel-track]');
      if (!this.track) return;
      this.prev = this.querySelector('[data-carousel-prev]');
      this.next = this.querySelector('[data-carousel-next]');

      if (this.prev) this.prev.addEventListener('click', this.scrollBy.bind(this, -1));
      if (this.next) this.next.addEventListener('click', this.scrollBy.bind(this, 1));

      this.track.addEventListener('scroll', this.updateButtons.bind(this), { passive: true });
      window.addEventListener('resize', this.updateButtons.bind(this));
      this.updateButtons();
    }

    scrollBy(direction) {
      var item = this.track.querySelector('[data-carousel-item]');
      var amount = item ? item.getBoundingClientRect().width + 20 : this.track.clientWidth * 0.8;
      this.track.scrollBy({
        left: amount * direction,
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
      });
    }

    updateButtons() {
      if (!this.prev || !this.next) return;
      var maxScroll = this.track.scrollWidth - this.track.clientWidth - 2;
      this.prev.disabled = this.track.scrollLeft <= 0;
      this.next.disabled = this.track.scrollLeft >= maxScroll;
    }
  }

  customElements.define('scroll-carousel', ScrollCarousel);

  /* ----------------------------------------------------------------------
     Accordion — one open at a time inside a group
     ---------------------------------------------------------------------- */

  class AccordionGroup extends HTMLElement {
    connectedCallback() {
      if (this.dataset.exclusive !== 'true') return;
      this.items = Array.prototype.slice.call(this.querySelectorAll('details'));
      this.items.forEach(
        function (item) {
          item.addEventListener(
            'toggle',
            function () {
              if (!item.open) return;
              this.items.forEach(function (other) {
                if (other !== item) other.open = false;
              });
            }.bind(this)
          );
        }.bind(this)
      );
    }
  }

  customElements.define('accordion-group', AccordionGroup);

  /* ----------------------------------------------------------------------
     Header cart count
     ---------------------------------------------------------------------- */

  document.addEventListener('cart:updated', function () {
    Cart.get().then(function (cart) {
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = cart.item_count;
        el.toggleAttribute('hidden', cart.item_count === 0);
      });
    });
  });

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-cart-open]');
    if (!trigger) return;
    event.preventDefault();
    document.dispatchEvent(new CustomEvent('cart:open'));
  });

  /* ----------------------------------------------------------------------
     Autoplay video, gated on reduced motion
     ---------------------------------------------------------------------- */

  function setupVideos() {
    var videos = document.querySelectorAll('[data-theme-video]');
    if (!videos.length) return;

    var play = function (video) {
      if (prefersReducedMotion.matches) {
        video.pause();
        video.removeAttribute('autoplay');
        return;
      }
      if (video.preload === 'none') video.preload = 'auto';
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
    };

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              play(entry.target);
            } else {
              entry.target.pause();
            }
          });
        },
        { threshold: 0.25 }
      );
      videos.forEach(function (video) {
        observer.observe(video);
      });
    } else {
      videos.forEach(play);
    }

    prefersReducedMotion.addEventListener('change', function () {
      videos.forEach(function (video) {
        if (prefersReducedMotion.matches) {
          video.pause();
        } else {
          play(video);
        }
      });
    });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */

  function setupReveal() {
    if (settings.animationsEnabled === false || prefersReducedMotion.matches) return;
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px' }
    );

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  function init() {
    setupVideos();
    setupReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-run when a section is re-rendered in the theme editor. */
  document.addEventListener('shopify:section:load', init);
})();
