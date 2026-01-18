console.log("CODFORMPAY V.1.1.0");

class ProductPageDetector {
    constructor() {
        this.isProductPage = false;
        this.currentProduct = null;
        this.currentVariantId = null;
        this.observers = [];
        this.init();
    }

    init() {
        this.detectPageType();
        if (this.isProductPage) {
            this.extractProductData();
            this.setupObservers();
        }
    }

    detectPageType() {
        const path = window.location.pathname;
        this.isProductPage = path.includes('/products/');
        return this.isProductPage;
    }

    async extractProductData() {
        if (!this.isProductPage) return null;

        const productHandle = this.getProductHandleFromURL();
        if (!productHandle) return null;

        try {
            const response = await fetch(`/products/${productHandle}.js`);
            if (response.ok) {
                const productData = await response.json();
                this.currentProduct = productData;

                this.currentVariantId = productData.variants[0]?.id;

                this.detectCurrentVariant();

                this.notifyObservers({
                    type: 'product_loaded',
                    product: this.currentProduct,
                    variantId: this.currentVariantId
                });

                return productData;
            }
        } catch (error) {
            this.fallbackExtractProductData();
        }
    }

    getProductHandleFromURL() {
        const path = window.location.pathname;
        const match = path.match(/\/products\/([^\/?]+)/);
        return match ? match[1] : null;
    }

    detectCurrentVariant() {
        try {
            const variantInput = document.querySelector('[name="id"], [data-product-variant-id]');
            if (variantInput && variantInput.value) {
                return variantInput.value;
            }

            if (this.currentProduct?.variants?.length) {
                const selected = this.currentProduct.variants.find(v => v.available);
                return selected ? selected.id : null;
            }

            return null;
        } catch (err) {
            console.error("❌ Error detecting variant:", err);
            return null;
        }
    }

    getSelectedOptions() {
        const options = [];
        const optionInputs = document.querySelectorAll('form[action*="/cart/add"] [name*="option"]');

        optionInputs.forEach(input => {
            if (input.type === 'select-one') {
                options.push(input.value);
            } else if (input.type === 'radio' && input.checked) {
                options.push(input.value);
            } else if (input.type === 'hidden' || input.type === 'text') {
                options.push(input.value);
            }
        });

        return options;
    }

    findVariantByOptions(selectedOptions) {
        if (!this.currentProduct) return null;

        return this.currentProduct.variants.find(variant => {
            return variant.options.every((option, index) => {
                return option === selectedOptions[index];
            });
        });
    }

    setupObservers() {
        this.observeVariantChanges();
        this.observeQuantityChanges();
    }

    observeVariantChanges() {
        const variantSelectors = [
            'form[action*="/cart/add"] [name*="option"]',
            'form[action*="/cart/add"] [name="id"]'
        ];

        variantSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.addEventListener('change', (e) => {
                    setTimeout(() => {
                        this.handleVariantChange();
                    }, 100);
                });
            });
        });
    }

    observeQuantityChanges() {
        const quantityInput = document.querySelector('form[action*="/cart/add"] [name="quantity"]');
        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                this.handleQuantityChange(e.target.value);
            });
            quantityInput.addEventListener('input', (e) => {
                this.handleQuantityChange(e.target.value);
            });
        }
    }

    handleVariantChange() {
        this.detectCurrentVariant();

        if (this.currentVariantId && this.currentProduct) {
            const variant = this.currentProduct.variants.find(v => v.id == this.currentVariantId);

            this.notifyObservers({
                type: 'variant_changed',
                variant: variant,
                variantId: this.currentVariantId,
                price: variant?.price
            });
        }
    }

    handleQuantityChange(quantity) {
        this.notifyObservers({
            type: 'quantity_changed',
            quantity: parseInt(quantity) || 1
        });
    }

    getCurrentPrice() {
        if (!this.currentVariantId || !this.currentProduct) return 0;

        const variant = this.currentProduct.variants.find(v => v.id == this.currentVariantId);
        return variant ? variant.price : this.currentProduct.variants[0]?.price || 0;
    }

    getCurrentVariant() {
        if (!this.currentVariantId || !this.currentProduct) return null;
        return this.currentProduct.variants.find(v => v.id == this.currentVariantId);
    }

    addObserver(callback) {
        this.observers.push(callback);
    }

    notifyObservers(data) {
        this.observers.forEach(observer => {
            try {
                observer(data);
            } catch (error) {
                console.error('Error in observer:', error);
            }
        });
    }

    fallbackExtractProductData() {
        const form = document.querySelector('form[action*="/cart/add"]');
        if (!form) return null;

        const idInput = form.querySelector('[name="id"]');
        if (!idInput) return null;

        const price = this.extractPriceFromPage();

        this.currentProduct = {
            id: this.extractProductIdFromPage(),
            variants: [{ id: idInput.value, price: price }],
            price: price
        };

        this.currentVariantId = idInput.value;
    }

    extractProductIdFromPage() {
        const jsonElement = document.querySelector('[type="application/json"][data-product]');
        if (jsonElement) {
            try {
                const data = JSON.parse(jsonElement.textContent);
                return data.id;
            } catch (e) { }
        }
        return null;
    }

    extractPriceFromPage() {
        const priceElement = document.querySelector('.product-price .money, .price .money, [data-product-price] .money');
        if (priceElement) {
            const priceText = priceElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
            const price = parseFloat(priceText);
            return !isNaN(price) ? Math.round(price * 100) : 0;
        }
        return 0;
    }
}

class CartManager {
    constructor() {
        this.cart = null;
        this.isUpdating = false;
    }

    async getCart() {
        try {
            const response = await fetch('/cart.js');
            if (response.ok) {
                this.cart = await response.json();
                return this.cart;
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
        return null;
    }

    async addToCart(variantId, quantity = 1, properties = {}) {
        if (this.isUpdating) return;

        this.isUpdating = true;
        try {
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: [{
                        id: variantId,
                        quantity: quantity,
                        properties: properties
                    }]
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.cart = result;
                return result;
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            this.isUpdating = false;
        }
        return null;
    }

    async updateCart(variantId, quantity) {
        if (this.isUpdating) return;

        this.isUpdating = true;
        try {
            const response = await fetch('/cart/update.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    updates: {
                        [variantId]: quantity
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.cart = result;
                return result;
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        } finally {
            this.isUpdating = false;
        }
        return null;
    }

    async clearCart() {
        try {
            const response = await fetch('/cart/clear.js', {
                method: 'POST'
            });
            if (response.ok) {
                this.cart = { items: [] };
                return true;
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
        return false;
    }
}

class ProductFormBuilder {
    constructor() {
        this.detector = new ProductPageDetector();
        this.cartManager = new CartManager();
        this.config = null;
        this.currentQuantity = 1;
        this.currentShipping = null;
        this.isFormOpen = false;
        this.configButton = null;
        this.downsellShown = false;
        this.activeDiscount = null;
        this.activeQuantityOffer = null;
        this.originalFormHTML = null;
        this.apiBaseUrl = "https://seafood-neutral-celebrate-celebrate.trycloudflare.com";
        this.isSubmitting = false;
        this.init();
    }

    async init() {
        if (!this.detector.isProductPage) {
            return;
        }

        await this.detector.extractProductData();
        await this.fetchFormConfig();

        this.applyPopupModalStyles();
        if (this.config.form.formType === 'EMBEDDED') {
            this.createEmbeddedForm();
        } else {
            this.createPopupForm();
        }

        this.setupFormHandlers();
        this.setupValidation();

        await this.initializeCart();
        this.setupMonitoring();

        this.handleQuantityOffers();
    }

    async fetchFormConfig() {
        const shop = window.Shopify?.shop || this.extractShopFromDOM();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/public-form-config?shop=${shop}`);
            const data = await response.json();

            if (data.success) {
                this.config = data.config;
                this.formConfig = data.form;
                this.upsells = data.config.offers?.upsells || [];
                this.downsells = data.config.offers?.downsells || [];
                if (this.config.shipping && this.config.shipping.length > 0) {
                    this.currentShipping = this.config.shipping[0];
                }
            } else {
                console.error('❌ Failed to load config:', data.error);
            }
        } catch (error) {
            console.error("❌ Error fetching config:", error);
        }
    }

    createEmbeddedForm() {
        let formContainer = document.getElementById('formino-cod-form');

        if (formContainer) {
        } else {
            const buttonAreas = [
                '.product-form-buttons',
                '.product-actions',
                '.product-buy-buttons',
                '.add-to-cart-container',
                '[class*="button"]:not(.quantity-minus):not(.quantity-plus)',
                'button[type="submit"][name="add"]',
                '.add-to-cart-button',
                '.shopify-payment-button'
            ];

            let targetButtonArea = null;

            for (const selector of buttonAreas) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const style = window.getComputedStyle(element);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null) {
                        let container = element.closest('.product-form-buttons, .product-actions, .product-buy-buttons');
                        if (!container) container = element.parentElement;

                        if (container) {
                            targetButtonArea = container;
                            break;
                        }
                    }
                }
                if (targetButtonArea) break;
            }

            if (targetButtonArea) {
                formContainer = document.createElement('div');
                formContainer.id = 'formino-cod-form';
                formContainer.className = 'formino-cod-form';
                targetButtonArea.insertAdjacentElement('afterend', formContainer);
            } else {
                formContainer = document.createElement('div');
                formContainer.id = 'formino-cod-form';
                formContainer.className = 'formino-cod-form';
                document.body.appendChild(formContainer);
            }
        }

        try {
            const existingForm = formContainer.querySelector('.formino-form');
            if (existingForm) {
                this.applyFormStyles();
                this.updateFormTotals();
                return true;
            }

            const formHTML = this.generateFormHTML("Embedded");

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formHTML.trim();
            const newFormContainer = tempDiv.firstElementChild;
            formContainer.appendChild(newFormContainer);

            this.applyFormStyles();
            this.updateFormTotals();

            return true;

        } catch (error) {
            return false;
        }
    }

    createPopupForm() {
        this.createPopupButton();
        this.createPopupModal();
    }

    createPopupButton() {
        const buyButton = this.config.form.buyButton;
        if (!buyButton) return;

        const iconHtml = buyButton.icon && buyButton.icon !== 'none' ? this.getButtonIcon(buyButton.icon) : '';

        const style = `
            style="background: ${this.hsbToRgba(buyButton.backgroundColor)};"
        `;

        const buttonHTML = `
          <div class="formino-block-popup-button">
            <button class="formino-popup-trigger" id="formino-popup-trigger">
              ${iconHtml}
              ${buyButton.text}
              ${buyButton.subtitle ? `<span class="formino-button-subtitle">${buyButton.subtitle}</span>` : ''}
            </button>
          </div>
        `;

        const codForm = document.getElementById('formino-cod-form');
        if (codForm) {
            codForm.insertAdjacentHTML('beforebegin', buttonHTML);
        }
        else {
            const addToCartButton = document.querySelector('[name="add"], .add-to-cart, .product-form__submit');
            if (addToCartButton) {
                addToCartButton.insertAdjacentHTML('afterend', buttonHTML);
            }
            else {
                document.body.insertAdjacentHTML('beforeend', buttonHTML);
            }
        }

        this.setupPopupButtonStyles();
        this.setupPopupButtonHandlers();
    }

    setupPopupButtonStyles() {
        const button = document.getElementById('formino-popup-trigger');
        if (!button || !this.config.form.buyButton) return;

        const buyButton = this.config.form.buyButton;

        button.style.cssText = `
            font-size: ${buyButton.fontSize}px;
            border-radius: ${buyButton.borderRadius}px;
            color: ${this.hsbToRgba(buyButton.textColor)};
            background-color: ${this.hsbToRgba(buyButton.backgroundColor)};
            border: ${buyButton.borderWidth}px solid ${this.hsbToRgba(buyButton.borderColor)};
            ${buyButton.shadow ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.2)' : ''};
            padding: 16px 24px;
            margin-top: 6px;
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
        `;

        if (buyButton.stickyPosition && buyButton.mobileSticky) {
            button.style.position = 'fixed';
            button.style[buyButton.stickyPosition] = '20px';
            button.style.zIndex = '1000';
        }
    }

    hsbToRgba({ hue, saturation, brightness, alpha }) {
        const h = hue;
        const s = saturation;
        const v = brightness;
        const a = alpha ?? 1;

        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r, g, b;

        if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else[r, g, b] = [c, 0, x];

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    setupPopupButtonHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'formino-popup-trigger' || e.target.closest('#formino-popup-trigger')) {
                this.openPopupModal();
            }
        });

        document.addEventListener('click', (e) => {
            const overlay = document.getElementById('formino-modal-overlay');
            if (overlay && e.target === overlay) {
                overlay.style.display = 'none';
                this.isFormOpen = false;
            }
        });
    }

    openPopupModal() {
        if (!document.getElementById('formino-modal-overlay')) {
            this.createPopupModal();
        }

        const modalOverlay = document.getElementById('formino-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
            this.isFormOpen = true;

            this.updateFormTotals();
        }
    }

    createPopupModal() {
        const existingModal = document.getElementById('formino-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
        <div class="formino-modal-overlay" id="formino-modal-overlay" style="display: none;">
            <div class="formino-modal-container" id="formino-modal-container">
                <div class="formino-modal-content">
                    ${this.generateFormHTML("popup")}
                </div>
            </div>
        </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.applyFormStyles();
        this.updateFormTotals();

        this.setupPopupCloseHandlers();
    }

    generateFormHTML(type) {
        if (!this.config) return '';

        let closeButton = '';
        if (type == "popup") {
            closeButton = `
        <div
          style="
            position: absolute;
            right: 0px;
            top: 10px;
            font-size: 15px;
            width: 25px;
            height: 25px;
            border: 1px solid #e0e0e0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding-bottom: 0px;
            font-weight: 600;
            border-radius: 50px;
            color: #555555;
            cursor: pointer;
          "
        >x</div>
      `;
        }

        const fields = this.config.form.fields
            .filter(field => field.visible)
            .map(field => this.renderField(field))
            .join('');

        return `
      <div class="formino-form-container">
        <div class="formino-header">
            <h3>${this.config.form.title}</h3>
            ${this.config.form.formType !== 'EMBEDDED' && !this.config.form.hideCloseButton ?
                '<button type="button" class="formino-close-button formino-popup-close">&times;</button>' : ''}
        </div>
        <form class="formino-form" id="formino-main-form">
          ${fields}
        </form>
      </div>
    `;
    }

    renderField(field) {
        switch (field.type) {
            case 'input':
                return this.renderInputField(field);
            case 'section':
                return this.renderSectionField(field);
            case 'button':
                return this.renderButtonField(field);
            case 'subscribe':
                return this.renderSubscribeField(field); 
            default:
                return '';
        }
    }

    renderInputField(field) {
        const iconHTML = field.showIcon ? this.getIconForField(field.label) : '';
        let label = '';
        if (this.config['form'].hideFieldLabels == false) {
            label = field.displayLabel ? field.displayLabel : field.label;
            label = field.required ? label + '<span style="margin-left: 3px; color: #c70505;">*</span>' : label;
        }

        return `
            <div class="formino-group-input">
                <label for="formino-field-${field.id}">${label}</label>
                <div class="formino-field-group">
                    <div 
                        class="formino-field formino-input-field" 
                        data-field-id="${field.id}"
                    >
                        ${iconHTML}
                        <input 
                        type="text" 
                        id="formino-field-${field.id}"
                        name="${field.label.toLowerCase().replace(' ', '_')}"
                        placeholder="${field.placeholder}"
                        ${field.required ? 'required' : ''}
                        minlength="${field.minLength}"
                        maxlength="${field.maxLength}"
                        class="formino-input"
                        >
                    </div>
                    <div class="formino-error-message">${field.errorText}</div>
                </div>
            </div>
        `;
    }

    renderSectionField(field) {
        switch (field.id) {
            case 15: // TOTALS SUMMARY
                return this.renderTotalsSection(field);
            case 2: // SHIPPING RATES
                return this.renderShippingSection(field);
            case 4: // DISCOUNT CODES
                return this.renderDiscountSection(field);
            case 3: // UPSELL AREAS
                return this.renderUpsellSection(field);
            default:
                return this.renderGenericSection(field);
        }
    }

    getIconForField(label) {
        const fieldName = label.toLowerCase().replace(/\s+/g, "");

        switch (fieldName) {
            case "firstname":
            case "lastname":
                return `
        <div class="iconInputFormino">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#444">
            <path fill-rule="evenodd" d="M7 8.25a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
            <path fill-rule="evenodd" d="M15.168 15.435a7.5 7.5 0 1 1-10.336-10.87 7.5 7.5 0 0 1 10.336 10.87Zm-9.83-1.659a6 6 0 1 1 9.326 0 7.03 7.03 0 0 0-4.664-1.776 7.03 7.03 0 0 0-4.663 1.776Zm1.086 1.043a5.973 5.973 0 0 0 3.576 1.181c1.34 0 2.577-.44 3.576-1.181a5.53 5.53 0 0 0-3.576-1.319 5.53 5.53 0 0 0-3.576 1.319Z" />
          </svg>
        </div>
      `;

            case "province":
                return `
        <div class="iconInputFormino">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#444">
            <path fill-rule="evenodd" d="M14.239 4.379a.75.75 0 1 0-1.478-.257l-.457 2.628h-3.478l.413-2.371a.75.75 0 0 0-1.478-.257l-.457 2.628h-2.804a.75.75 0 0 0 0 1.5h2.543l-.609 3.5h-2.434a.75.75 0 0 0 0 1.5h2.174l-.413 2.372a.75.75 0 1 0 1.478.257l.457-2.629h3.478l-.413 2.372a.75.75 0 1 0 1.478.257l.457-2.629h2.804a.75.75 0 0 0 0-1.5h-2.543l.609-3.5h2.434a.75.75 0 0 0 0-1.5h-2.174l.413-2.371Zm-6.282 7.371h3.477l.61-3.5h-3.478l-.61 3.5Z"/>
          </svg>
        </div>
      `;

            case "address":
            case "address2":
            case "city":
            case "zipcode":
                return `
        <div class="iconInputFormino">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#444">
            <path fill-rule="evenodd" d="M14.25 16h-3.077l.07-.061a17.427 17.427 0 0 0 1.707-1.758c1.224-1.46 2.55-3.574 2.55-5.954 0-3.167-2.328-5.477-5.5-5.477s-5.5 2.31-5.5 5.477c0 2.38 1.326 4.495 2.55 5.954a17.426 17.426 0 0 0 1.708 1.758l.069.061h-3.077a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5Zm-4.25-5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          </svg>
        </div>
      `;

            case "phonenumber":
                return `
        <div class="iconInputFormino">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#444">
            <path d="M7.75 13.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
            <path fill-rule="evenodd" d="M4.75 5.75a2.75 2.75 0 0 1 2.75-2.75h5a2.75 2.75 0 0 1 2.75 2.75v8.5a2.75 2.75 0 0 1-2.75 2.75h-5a2.75 2.75 0 0 1-2.75-2.75v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-.531a1 1 0 0 1-.969.75h-2a1 1 0 0 1-.969-.75h-.531Z" />
          </svg>
        </div>
      `;

            case "email":
                return `
        <div class="iconInputFormino">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#444">
            <path fill-rule="evenodd" d="M5.75 4.5c-1.519 0-2.75 1.231-2.75 2.75v5.5c0 1.519 1.231 2.75 2.75 2.75h8.5c1.519 0 2.75-1.231 2.75-2.75v-5.5c0-1.519-1.231-2.75-2.75-2.75h-8.5Zm-1.25 2.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-5.5Zm2.067.32c-.375-.175-.821-.013-.997.363-.175.375-.013.821.363.997l3.538 1.651c.335.156.723.156 1.058 0l3.538-1.651c.376-.176.538-.622.363-.997-.175-.376-.622-.538-.997-.363l-3.433 1.602-3.433-1.602Z"/>
          </svg>
        </div>
      `;

            default:
                return "";
        }
    }

    renderTotalsSection(field) {
        const settings = field.totalSettings;
        const subtotal = this.detector.getCurrentPrice() / 100;
        const shipping = this.currentShipping ? this.currentShipping.price : 0;
        const total = subtotal + shipping;
        return `
            <div class="formino-section formino-totals-section" data-field-id="${field.id}" 
                style="background-color: ${settings.backgroundColor || '#f8f9fa'}">
                <div class="formino-total-line">
                    <span>${settings.subtotalTitle}</span>
                    <span class="formino-subtotal">${this.formatMoney(subtotal)}</span>
                </div>
                <div class="formino-total-line">
                    <span>${settings.shippingTitle}</span>
                    <span class="formino-shipping-cost">${shipping === 0 ? settings.freeText : this.formatMoney(shipping)}</span>
                </div>
                <div class="formino-total-line" style="display: none;">
                    <span>${settings.discountTitle}</span>
                    <span class="formino-discount-cost"></span>
                </div>
                <div class="formino-total-line formino-total">
                    <span>${settings.totalTitle}</span>
                    <span class="formino-total-amount">${this.formatMoney(total)}</span>
                </div>
            </div>
        `;
    }

    renderShippingSection(field) {
        const settings = field.shippingSettings;
        if (!this.config.shipping || this.config.shipping.length === 0) return '';

        return `
        <div class="formino-section formino-shipping-section" data-field-id="${field.id}">
        <h4 style="font-size: ${settings.fontSize || 16}px; font-weight: ${settings.fontWeight || 600}; padding: 0px; margin: 0px;">${settings.title}</h4>
        <div class="formino-shipping-options">
            ${this.config.shipping.map((rate, index) => `
                <label class="formino-shipping-option">
                    <input type="radio" name="shipping_method" value="${rate.id}" 
                            ${index === 0 ? 'checked' : ''}>
                    <span class="formino-shipping-name">${rate.name}</span>
                    <span class="formino-shipping-price">${rate.price === 0 ? settings.freeText : this.formatMoney(rate.price)}</span>
                </label>
            `).join('')}
        </div>
        </div>
        `;
    }

    renderDiscountSection(field) {
        if (!field.visible) return '';
        const settings = field.discountSettings;

        return `
      <div class="formino-section formino-discount-section" data-field-id="${field.id}">
        <h4> Discount Code </h4>
        <div class="formino-discount-input-group">
          <input type="text" class="formino-discount-input" placeholder="${settings.fieldLabel}">
          <button type="button" class="formino-discount-button" 
                  style="background-color: ${settings.buttonBackgroundColor || '#000000'}">
              ${settings.applyButtonText}
          </button>
        </div>
      </div>
    `;
    }

    renderUpsellSection(field) {
        if (!field.visible) return '';
        return `
            <div class="formino-section formino-upsell-section" style="display: none;" data-field-id="${field.id}">
                <!-- سيتم إضافة الـ upsells هنا لاحقاً -->
            </div>
        `;
    }

    renderGenericSection(field) {
        const settings = field.sectionSettings || {};
        return `
      <div class="formino-section formino-generic-section" data-field-id="${field.id}"
        style="text-align: ${settings.alignment || 'left'}; color: ${settings.textColor || '#000000'};">
        <h4 style="font-size: ${settings.fontSize || 16}px; font-weight: ${settings.fontWeight || 'bold'}">
            ${settings.customText || field.label}
        </h4>
      </div>
    `;
    }

    renderButtonField(field) {
        const settings = field.buttonSettings;
        this.configButton = settings;
        const iconHtml = settings.buttonIcon && settings.buttonIcon !== 'none' ? this.getButtonIcon(settings.buttonIcon) : '';

        return `
        <div class="formino-section formino-button-section" data-field-id="${field.id}">
            <button type="submit" class="formino-submit-button"
                    style="background-color: ${settings.backgroundColor}; 
                            color: ${settings.textColor};
                            font-size: ${settings.fontSize}px;
                            width: 100%;
                            border-radius: ${settings.borderRadius}px;
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: center;
                            border: ${settings.borderWidth}px solid ${settings.borderColor};
                            ${settings.shadow ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.1)' : ''}">
                <span class="elementButtonGROWCOD" style="
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: center;">
                ${iconHtml}
                <span>${this.replacePlaceholders(settings.buttonText)}</span>
                ${settings.buttonSubtitle ?
                `<span class="formino-button-subtitle">${settings.buttonSubtitle}</span>` : ''}
                </span>
            </button>
        </div>
        `;
    }

    renderSubscribeField(field) {
        return `
            <div class="titleSubscribeFormino">
            <input type="checkbox" id="forminoSubscribe" name="forminoSubscribe" value="true">
            <label for="forminoSubscribe">${field.subscribeSettings?.label}</label>
            <div class="descriptionSubscribeFormino">
                <p>${field.subscribeSettings?.description}</p>
                <p>${field.subscribeSettings?.privacyText}</p>
            </div>
            </div>
        `;
    }

    getButtonIcon(icon) {
        switch (icon) {
            case 'cart':
                return (
                    `
          <span style="display: flex; align-items: center; margin-right: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
              <path d="M6.25 11.25a.75.75 0 0 0 0 1.5h2.75a.75.75 0 0 0 0-1.5h-2.75Z" />
              <path fillRule="evenodd" d="M2.5 7.25a2.75 2.75 0 0 1 2.75-2.75h9.5a2.75 2.75 0 0 1 2.75 2.75v5.5a2.75 2.75 0 0 1-2.75 2.75h-9.5a2.75 2.75 0 0 1-2.75-2.75v-5.5Zm12.25-1.25c.69 0 1.25.56 1.25 1.25h-12c0-.69.56-1.25 1.25-1.25h9.5Zm1.25 3.25h-12v3.5c0 .69.56 1.25 1.25 1.25h9.5c.69 0 1.25-.56 1.25-1.25v-3.5Z" />
            </svg>
          </span>
          `
                );
            case 'star':
                return (
                    `
          <span style="display: flex; align-items: center; margin-right: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
              <path d="M11.128 4.123c-.453-.95-1.803-.95-2.256 0l-1.39 2.912-3.199.421c-1.042.138-1.46 1.422-.697 2.146l2.34 2.222-.587 3.172c-.192 1.034.901 1.828 1.825 1.327l2.836-1.54 2.836 1.54c.924.501 2.017-.293 1.825-1.327l-.587-3.172 2.34-2.222c.762-.724.345-2.008-.697-2.146l-3.2-.421-1.389-2.912Z" />
            </svg>
          </span>
          `
                );
            case 'truck':
                return (
                    `
          <span style="display: flex; align-items: center; margin-right: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
              <path fillRule="evenodd" d="M4 5.25a.75.75 0 0 1 .75-.75h6.991a2.75 2.75 0 0 1 2.645 1.995l.427 1.494a.25.25 0 0 0 .18.173l1.681.421a1.75 1.75 0 0 1 1.326 1.698v1.219a1.75 1.75 0 0 1-1.032 1.597 2.5 2.5 0 1 1-4.955.153h-3.025a2.5 2.5 0 1 1-4.78-.75h-.458a.75.75 0 0 1 0-1.5h2.5c.03 0 .06.002.088.005a2.493 2.493 0 0 1 1.947.745h4.43a2.493 2.493 0 0 1 1.785-.75c.698 0 1.33.286 1.783.748a.25.25 0 0 0 .217-.248v-1.22a.25.25 0 0 0-.19-.242l-1.682-.42a1.75 1.75 0 0 1-1.258-1.217l-.427-1.494a1.25 1.25 0 0 0-1.202-.907h-6.991a.75.75 0 0 1-.75-.75Zm2.5 9.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              <path d="M3.25 8a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z" />
            </svg>
          </span>
          `
                );
            case 'bag':
                return (
                    `
          <span style="display: flex; align-items: center; margin-right: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
              <path fillRule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z" />
              <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
              <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
            </svg>
          </span>
          `
                );
            case 'heart':
                return (
                    `
          <span style="display: flex; align-items: center; margin-right: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
              <path fill-rule="evenodd" d="M8.469 5.785c-.966-1.047-2.505-1.047-3.47 0-.998 1.081-.998 2.857 0 3.939l5.001 5.42 5.002-5.42c.997-1.082.997-2.858 0-3.939-.966-1.047-2.505-1.047-3.47 0l-.98 1.062a.75.75 0 0 1-1.103 0l-.98-1.062Zm-4.573-1.017c1.56-1.69 4.115-1.69 5.675 0l.429.464.429-.464c1.56-1.69 4.115-1.69 5.675 0 1.528 1.656 1.528 4.317 0 5.973l-5.185 5.62a1.25 1.25 0 0 1-1.838 0l-5.185-5.62c-1.528-1.656-1.528-4.317 0-5.973Z" />
            </svg>
          </span>
          `
                );
            default:
                return null;
        }
    }

    replacePlaceholders(text) {
        if (!text) return '';
        return text.replace(/{order_total}/g, '<span class="formino-dynamic-total">' + this.formatMoney(0) + '</span>')
            .replace(/{order_subtotal}/g, '<span class="formino-dynamic-subtotal">' + this.formatMoney(0) + '</span>');
    }

    applyFormStyles() {
        const formContainer = document.querySelector('.formino-form-container');
        if (!formContainer || !this.config) return;

        const formStyle = this.config.form;

        // تطبيق إعدادات التصميم من الـ JSON
        formContainer.style.cssText = `
      position: relative;
      background-color: ${formStyle.backgroundColor} !important;
      max-width: 465px !important;
      margin: 20px auto !important;
      width: 100% !important;
      padding: 20px !important;
      color: ${formStyle.textColor} !important;
      border: ${formStyle.borderWidth}px solid ${formStyle.borderColor} !important;
      border-radius: ${formStyle.borderRadius}px !important;
      font-size: ${formStyle.textSize}px !important;
      font-family: ${formStyle.fontFamily} !important;
      ${formStyle.shadow ? 'box-shadow: 0 2px 20px rgba(0,0,0,0.15)' : ''} !important;
    `;

        // تطبيق الألوان الأساسية
        document.documentElement.style.setProperty('--formino-primary', formStyle.primaryColor);
        document.documentElement.style.setProperty('--formino-text', formStyle.textColor);
        document.documentElement.style.setProperty('--formino-background', formStyle.backgroundColor);
    }

    setupPopupCloseHandlers() {
        // 1. إغلاق عند النقر على زر الإغلاق (X)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('formino-popup-close') ||
                e.target.classList.contains('formino-close-button')) {
                this.closePopupModal();
            }
        });

        // 2. إغلاق عند النقر خارج المحتوى
        document.addEventListener('click', (e) => {
            const overlay = document.getElementById('formino-modal-overlay');
            const container = document.getElementById('formino-modal-container');

            if (overlay && e.target === overlay) {
                this.closePopupModal();
            }
        });

        // 3. إغلاق بالزر Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFormOpen) {
                this.closePopupModal();
            }
        });
    }

    closePopupModal(forceClose = false) {
        if (!forceClose && this.config.form.formType !== 'EMBEDDED' && !this.downsellShown && this.downsells && this.downsells.length > 0) {
            const downsellOffer = this.getMatchingDownsell();
            if (downsellOffer) {
                this.showDownsellPopup(downsellOffer);
                this.downsellShown = true;
                return false;
            }
        }

        // الإغلاق الفعلي
        const modalOverlay = document.getElementById('formino-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.animation = 'forminoPopupSlideOut 0.3s ease-in';
            setTimeout(() => {
                if (modalOverlay.parentNode) {
                    modalOverlay.remove();
                }
                this.isFormOpen = false;
                this.downsellShown = false;
                this.activeDiscount = null;
                this.originalFormHTML = null;
            }, 300);
        }

        return true;
    }

    setupFormHandlers() {
        const form = document.getElementById('formino-main-form');
        if (!form) return;

        form.onsubmit = async (e) => {
            e.preventDefault();

            if (this.isSubmitting) return;

            const btn = form.querySelector('.formino-submit-button');
            if (btn) {
                btn.classList.add('loading');
                btn.disabled = true;
            }

            try {
                await this.handleFormSubmit(e);
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                this.createCustomPopup({
                    type: 'error',
                    message: '⚠️ Failed to send order. Please try again.'
                });
            } finally {
                if (btn) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            }
        };

        const submitBtn = form.querySelector('.formino-submit-button');
        if (submitBtn) {
            submitBtn.onclick = (e) => {
                if (!form.checkValidity()) {
                }
            };
        }

        const shippingOptions = form.querySelectorAll('input[name="shipping_method"]');
        shippingOptions.forEach(radio => {
            radio.onclick = (e) => {
                const val = e.target.value;

                if (this.config?.shipping) {
                    const selectedRate = this.config.shipping.find(rate => rate.id === val);

                    if (selectedRate && (!this.currentShipping || this.currentShipping.id !== selectedRate.id)) {
                        this.currentShipping = selectedRate;

                        this.updateFormTotals();

                        form.querySelectorAll('.formino-shipping-option').forEach(option => {
                            option.style.backgroundColor = 'white';
                            option.style.borderColor = '#ddd';
                        });

                        const selectedOption = e.target.closest('.formino-shipping-option');
                        if (selectedOption) {
                            selectedOption.style.backgroundColor = '#f8fff8';
                            selectedOption.style.borderColor = '#008060';
                        }
                    }
                }
            };
        });

        const qtyInput = form.querySelector('input[name="quantity"]');
        if (qtyInput) {
            qtyInput.onchange = (e) => {
                this.currentQuantity = parseInt(e.target.value) || 1;
                this.updateFormTotals();
            };
        }
    }

    setupValidation() {
        const form = document.getElementById('formino-main-form');
        if (!form) {
            console.warn('⚠️ setupValidation: formino-main-form not found.');
            return;
        }

        form.addEventListener('focusout', (e) => {
            const target = e.target;
            if (target && target.classList.contains('formino-input') && target.hasAttribute('required')) {
                this.validateField(target);
            }
        }, true);

        form.addEventListener('input', (e) => {
            const target = e.target;
            if (target && target.classList.contains('formino-input')) {
                this.clearFieldError(target);
            }
        }, true);

    }

    validateField(input) {
        if (!input) return false;

        const field = input.closest('.formino-group-input');
        if (!field) {
            return true;
        }

        const fieldId = input.id ? input.id.replace('formino-field-', '') : null;
        const fieldConfig = Array.isArray(this.config?.form?.fields)
            ? this.config.form.fields.find(f => f.id == fieldId)
            : null;

        const value = (input.value || '').trim();

        if (input.hasAttribute('required') && !value) {
            field.classList.add('error');
            const errorMessage = fieldConfig?.errorText || 'This field is required';
            this.showError(field, errorMessage);
            return false;
        }

        if (fieldConfig?.minLength && value.length < fieldConfig.minLength) {
            field.classList.add('error');
            const errorMessage = fieldConfig?.errorText || `Minimum length is ${fieldConfig.minLength} characters`;
            this.showError(field, errorMessage);
            return false;
        }

        if (fieldConfig?.maxLength && value.length > fieldConfig.maxLength) {
            field.classList.add('error');
            const errorMessage = fieldConfig?.errorText || `Maximum length is ${fieldConfig.maxLength} characters`;
            this.showError(field, errorMessage);
            return false;
        }

        if (input.type === 'email' && value && !this.isValidEmail(value)) {
            field.classList.add('error');
            const errorMessage = fieldConfig?.errorText || 'Please enter a valid email address';
            this.showError(field, errorMessage);
            return false;
        }

        field.classList.remove('error');
        this.clearError(field);
        return true;
    }

    showError(field, message) {
        if (!field) return;

        const group = field.closest('.formino-group-input') || field;
        let errorElement = group.querySelector('.formino-error-message');

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'formino-error-message';
            errorElement.style.cssText = `
        color: #d32f2f;
        font-size: 13px;
        margin-top: 4px;
        font-weight: normal;
      `;
            group.appendChild(errorElement);
        }

        errorElement.textContent = message || 'Invalid field';
    }

    clearError(field) {
        if (!field) return;
        const group = field.closest('.formino-group-input') || field;
        const errorElement = group.querySelector('.formino-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    clearFieldError(input) {
        if (!input) return;
        const field = input.closest('.formino-group-input');
        if (field) {
            field.classList.remove('error');
            this.clearError(field);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const form = document.getElementById('formino-main-form');
        if (!form) {
            console.error("❌ Formino: formino-main-form not found!");
            return;
        }

        // ✅ 1. التحقق من الحقول المطلوبة
        const inputs = form.querySelectorAll('.formino-input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.createCustomPopup({
                type: 'warning',
                message: 'Please fill in all required fields before submitting your order.'
            });
            return;
        }

        const submitButton = form.querySelector('.formino-submit-button');
        if (submitButton) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;

            if (!submitButton.dataset.originalContent) {
                // حفظ العنصر الداخلي كاملاً
                const innerContent = submitButton.querySelector('.elementButtonGROWCOD');
                if (innerContent) {
                    submitButton.dataset.originalContent = innerContent.outerHTML;
                }
            }

            // إخفاء المحتوى الأصلي وإظهار spinner فقط
            submitButton.innerHTML = `
                <div class="formino-spinner"></div>
            `;

            // إضافة فئة لتوسيع الزر إذا لزم الأمر
            submitButton.classList.add('formino-loading-state');

        }

        try {

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            let variantId = null;
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('variant')) {
                variantId = urlParams.get('variant');
            } else if (this.detector?.currentVariantId) {
                variantId = this.detector.currentVariantId;
            } else if (typeof this.detector?.detectCurrentVariant === 'function') {
                this.detector.detectCurrentVariant();
                variantId = this.detector.currentVariantId;
            }

            const payload = {
                shop: Shopify.shop || window.location.hostname,
                product: this.detector.currentProduct || {},
                variantId,
                fields: data,
                shipping: this.currentShipping || null,
                totals: this.calculateTotals ? this.calculateTotals() : {},
                timestamp: new Date().toISOString()
            };

            const result = await this.submitOrder(payload);

            if (result.error === "order_blocked") {
                this.showBlockedUserMessage(result.message);
                return result;
            }
            // 1. تحقق من وجود عروض Upsell تنطبق على المنتج الحالي
            const currentProductId = `gid://shopify/Product/${this.detector.currentProduct.id}`;

            // البحث في مصفوفة الـ upsells (التي أرسلت بياناتها سابقاً)
            const activeUpsell = this.upsells?.find(upsell => {
                // التحقق من حالة العرض ونوعه
                if (upsell.status !== "ACTIVE" || upsell.type !== "POST_PURCHASE") {
                    return false;
                }

                const triggerMode = upsell.displayRules?.triggerMode || "SPECIFIC";
                const triggerProducts = upsell.displayRules?.triggerProducts;

                // إذا كان النمط هو ALL، يظهر العرض لجميع المنتجات
                if (triggerMode === "ALL" || triggerProducts === "ALL") {
                    return true;
                }

                // إذا كان النمط SPECIFIC وكان triggerProducts مصفوفة
                if (triggerMode === "SPECIFIC" && Array.isArray(triggerProducts)) {
                    // التحقق إذا كان المنتج الحالي موجود في المصفوفة
                    const isTriggered = triggerProducts.includes(currentProductId);
                    if (isTriggered) {
                        // console.log('✅ Upsell triggered for specific product:', currentProductId);
                    }
                    return isTriggered;
                }

                // الحالات الأخرى
                return false;
            });

            if (activeUpsell) {
                // إذا وجد عرض، أظهر النافذة المنبثقة بدلاً من رسالة النجاح التقليدية أو بعدها
                // console.log(activeUpsell)
                this.showUpsellPopup(activeUpsell, result);
            } else {
                // إذا لم يوجد عرض، أظهر رسالة النجاح المعتادة
                this.showSuccessMessage(result);
            }

        } catch (error) {
            console.error("❌ Error during submission:", error);
            this.showErrorMessage(error);
            this.createCustomPopup({
                type: 'error',
                message: 'Something went wrong while sending your order. Please try again.'
            });
        } finally {
            if (submitButton && submitButton.dataset.originalContent) {
                submitButton.classList.remove('loading');
                submitButton.classList.remove('formino-loading-state');
                submitButton.disabled = false;
                submitButton.innerHTML = submitButton.dataset.originalContent;

                // إعادة ربط الأحداث إذا لزم الأمر
                this.setupFormHandlers();
            }
        }
    }

    async submitOrder(payload = {}) {
        try {
            if (this.isSubmitting) {
                return { success: false, error: "already_submitting" };
            }

            this.isSubmitting = true;

            const formData = payload.fields || this.collectFormData?.() || {};
            const formDataToSend = new FormData();

            const shop = window.Shopify?.shop || this.extractShopFromDOM() || window.location.hostname;
            formDataToSend.append('shop', shop);

            formDataToSend.append('first_name', formData.first_name || '');
            formDataToSend.append('last_name', formData.last_name || '');
            formDataToSend.append('address', formData.address || '');
            formDataToSend.append('address_2', formData.address_2 || '');
            formDataToSend.append('city', formData.city || '');
            formDataToSend.append('province', formData.province || '');
            formDataToSend.append('phone_number', formData.phone_number || '');
            formDataToSend.append('zip_code', formData.zip_code || '');
            formDataToSend.append('email', formData.email || '');

            const shipping = payload.shipping || this.currentShipping || formData.shipping || null;
            if (shipping) {
                formDataToSend.append('shipping_method', shipping.id || '');
                formDataToSend.append('shipping', JSON.stringify(shipping));
            } else {
                formDataToSend.append('shipping_method', formData.shipping_method || '');
            }

            let finalPriceUnit = 0;
            let originalPriceUnit = this.detector.getCurrentPrice() / 100;

            // console.log("qty offer externe")
            if (this.activeQuantityTier) {
                // console.log("qty offer interne")
                const quantity = this.activeQuantityTier.quantity || 1;
                const discountType = this.activeQuantityTier.discountType;
                const discountValue = parseFloat(this.activeQuantityTier.discountValue);

                let totalBeforeDiscount = originalPriceUnit * quantity;

                if (discountType === "PERCENTAGE") {
                    finalPriceUnit = totalBeforeDiscount * (1 - discountValue / 100);
                } else if (discountType === "FIXED_AMOUNT") {
                    finalPriceUnit = totalBeforeDiscount - discountValue;
                } else {
                    finalPriceUnit = totalBeforeDiscount;
                }

                formDataToSend.append('quantity', quantity.toString());

                formDataToSend.append('quantity_offer', JSON.stringify({
                    tierId: this.activeQuantityTier.id,
                    quantity: quantity,
                    discountType: discountType,
                    discountValue: discountValue,
                    originalPrice: totalBeforeDiscount,
                    finalPrice: finalPriceUnit
                }));
            }
            else if (this.activeDiscount) {
                finalPriceUnit = this.activeDiscount.newPrice;
                formDataToSend.append('discount_applied', JSON.stringify(this.activeDiscount));
                formDataToSend.append('quantity', (formData.quantity?.toString() || '1'));
            }
            else {
                finalPriceUnit = originalPriceUnit * (parseInt(formData.quantity) || 1);
                formDataToSend.append('quantity', (formData.quantity?.toString() || '1'));
            }

            finalPriceUnit = Math.max(0, finalPriceUnit);

            const product = payload.product || this.detector.currentProduct || {};
            product.price = finalPriceUnit;
            formDataToSend.append('product', JSON.stringify(product));

            formDataToSend.append('variantId', payload.variantId || formData.variantId || '');
            formDataToSend.append('custom_price', finalPriceUnit);

            const shippingPrice = shipping ? shipping.price : 0;
            const totals = {
                subtotal: finalPriceUnit,
                shipping: shippingPrice,
                total: finalPriceUnit + shippingPrice,
                timestamp: new Date().toISOString()
            };
            formDataToSend.append('totals', JSON.stringify(totals));

            formDataToSend.append('config', JSON.stringify(this.config || {}));

            const response = await fetch(
                `${this.apiBaseUrl}/api/create-order`,
                {
                    method: 'POST',
                    body: formDataToSend
                }
            );

            const result = await response.json();

            if (result.success) {
                return result;
            } else {
                throw new Error(result.error || 'Unknown error occurred during order creation');
            }

        } catch (error) {
            this.createCustomPopup({
                type: 'error',
                message: `Failed to submit order: ${error.message}`
            });

            return {
                success: false,
                error: error.message,
                redirect: {
                    type: "thankYouMessage",
                    thankYouMessage: "Sorry, there was an error processing your order. Please try again."
                }
            };
        } finally {
            this.isSubmitting = false;
        }
    }

    collectFormData() {
        const form = document.getElementById('formino-main-form');
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        return {
            ...data,
            product: this.detector.currentProduct,
            variantId: this.detector.currentVariantId,
            quantity: this.currentQuantity,
            shipping: this.currentShipping,
            totals: this.calculateTotals()
        };
    }

    calculateTotals() {
        const subtotal = this.detector.getCurrentPrice() / 100;
        const shipping = this.currentShipping ? this.currentShipping.price : 0;
        const total = subtotal + shipping;

        return {
            subtotal: subtotal,
            shipping: shipping,
            total: total
        };
    }

    showSuccessMessage(response) {

        const redirect = response.redirect;

        let redirectUrl = redirect.redirectURL;
        if (redirect.type === "default" && redirect.orderStatusUrl) {
            redirectUrl = redirect.orderStatusUrl;
        }

        switch (redirect.type) {
            case "message":
                if (redirect.thankYouMessage) {
                    const formattedMessage = redirect.thankYouMessage.replace(/\\n/g, '\n');
                    this.createCustomPopup(formattedMessage);
                } else {
                    this.createCustomPopup('Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅');
                }
                this.resetForm();
                break;

            case "thankYouMessage":
                if (redirect.thankYouMessage) {
                    const formattedMessage = redirect.thankYouMessage.replace(/\\n/g, '\n');
                    this.createCustomPopup(formattedMessage);
                } else {
                    this.createCustomPopup('Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅');
                }

                this.resetForm();
                break;

            case "custom":
                if (redirectUrl) {
                    this.resetForm();
                    window.location.href = redirectUrl;
                } else {
                    this.createCustomPopup('Custom URL not configured');
                    this.resetForm();
                }
                break;

            case "whatsapp":
                if (redirectUrl) {
                    window.open(redirectUrl, '_blank');
                    if (redirect.thankYouMessage) {
                        const formattedMessage = redirect.thankYouMessage.replace(/\\n/g, '\n');
                        this.createCustomPopup(formattedMessage + '\n\nWhatsApp window opened in new tab.');
                    }
                    this.resetForm();
                } else {
                    this.createCustomPopup('WhatsApp number not configured');
                    this.resetForm();
                }
                break;

            case "default":
            default:
                if (redirectUrl) {
                    this.resetForm();
                    window.location.href = redirectUrl;
                } else {
                    const message = redirect.thankYouMessage
                        ? redirect.thankYouMessage.replace(/\\n/g, '\n')
                        : 'Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅';
                    this.createCustomPopup(message);
                    this.resetForm();
                }
                break;
        }

    }

    showBlockedUserMessage(customMessage = null) {
        const message = customMessage || 'Your order has been blocked due to security reasons. Please contact customer support if you believe this is an error.';
        this.createCustomPopup({
            type: 'error',
            message: message
        });

        setTimeout(() => {
            this.resetForm();
        }, 3000);
    }

    showErrorMessage(error) {
        this.createCustomPopup('Error submitting order: ' + error.message);
        setTimeout(() => {
            this.resetForm();
        }, 1000);
    }

    async initializeCart() {
        await this.cartManager.clearCart();

        const variantId = this.detector.currentVariantId;
        if (variantId) {
            await this.cartManager.addToCart(variantId, this.currentQuantity);
            this.updateFormTotals();
        }
    }

    setupMonitoring() {
        this.detector.addObserver((data) => {
            this.handleProductChange(data);
        });
    }

    handleProductChange(data) {
        switch (data.type) {
            case 'variant_changed':
                this.handleVariantChange(data.variantId, data.price);
                break;
            case 'quantity_changed':
                this.handleQuantityChange(data.quantity);
                break;
        }
    }

    async handleVariantChange(variantId, price) {
        await this.cartManager.updateCart(variantId, this.currentQuantity);
        this.updateFormTotals();
    }

    async handleQuantityChange(quantity) {
        this.currentQuantity = quantity;
        if (this.detector.currentVariantId) {
            await this.cartManager.updateCart(this.detector.currentVariantId, quantity);
            this.updateFormTotals();
        }
    }

    formatMoney(amount) {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' ' + (this.config?.form?.currency || Shopify.currency.active);
    }

    extractShopFromDOM() {
        return window.location.hostname;
    }

    getDefaultConfig() {
        return {
            form: {
                formType: 'EMBEDDED',
                title: 'Complete Your Order',
                primaryColor: '#008060',
                textColor: '#333',
                backgroundColor: '#fff',
                fields: []
            },
            shipping: []
        };
    }

    createCustomPopup(message) {
        try {
            this.removeExistingPopup();

            const opts = typeof message === "object" && message !== null
                ? message
                : { type: "info", message };

            const type = opts.type || "info";
            const title =
                opts.title ||
                (type === "success"
                    ? "✅ Success"
                    : type === "error"
                        ? "❌ Error"
                        : type === "warning"
                            ? "⚠️ Warning"
                            : "ℹ️ Information");

            const safeMessage =
                typeof opts.message === "string"
                    ? opts.message.replace(/\\n/g, "<br>")
                    : JSON.stringify(opts.message || "");

            const headerColor =
                type === "success"
                    ? "#28a745"
                    : type === "error"
                        ? "#dc3545"
                        : type === "warning"
                            ? "#ffc107"
                            : "#007bff";

            const popupHTML = `
                <div class="formino-thankyou-popup" id="formino-thankyou-popup">
                    <div class="formino-popup-overlay"></div>
                    <div class="formino-popup-content">
                    <div class="formino-popup-header" style="border-bottom: 0px solid ${headerColor};">
                        <h3 style="color: ${headerColor};"></h3>
                        <button type="button" class="formino-popup-close">&times;</button>
                    </div>
                    <div class="formino-popup-body">
                        <div class="formino-popup-message">
                        ${safeMessage}
                        </div>
                    </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML("beforeend", popupHTML);

            // this.applyPopupStyles();

            this.setupPopupHandlers();

        } catch (err) {
            console.error("❌ Error creating popup:", err);
        }
    }

    removeExistingPopup() {
        const existingPopup = document.getElementById('formino-thankyou-popup');
        const forminoPopup = document.getElementById('formino-modal-overlay');
        if (existingPopup) {
            existingPopup.remove();
        }
        if (forminoPopup) {
            forminoPopup.remove();
        }
    }

    applyPopupModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .formino-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .formino-modal-container {
                width: 100%;
                height: 100%;
            }
            
            .formino-close-button {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                z-index: 10001;
            }
            
            .formino-close-button:hover {
                color: #000;
            }

            /* Thank You Popup Styles */
            .formino-thankyou-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .formino-popup-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(2px);
            }
            
            .formino-popup-content {
                position: relative !important;
                border-radius: 12px !important;
                max-width: 500px !important;
                margin: 20px auto !important;
                width: 90% !important;
                max-height: 80vh !important;
                overflow: hidden !important;
                animation: forminoPopupSlideIn 0.3s ease-out !important;
                background: #FFFFFF;
            }
            
            @keyframes forminoPopupSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .formino-popup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0px 5px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .formino-popup-header h3 {
                margin: 0;
                color: #2ecc71;
                font-size: 24px;
                font-weight: 600;
            }

            .formino-total-amount,
            .formino-shipping-cost,
            .formino-subtotal {
                font-weight: 700 !important;
            }
            
            .formino-popup-close {
                position: absolute;
                content: "";
                background: none;
                right: 0px !important;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                top: 4px;
            }
            
            .formino-popup-close:hover {
                background: #f5f5f5;
                color: #333;
            }
            
            .formino-popup-body {
                padding: 24px;
                text-align: center;
            }
            
            .formino-popup-message {
                font-size: 20px;
                line-height: 1.75;
                color: #333;
                font-weight: 700;
            }
            
            .formino-popup-footer {
                padding: 0 24px 24px;
                text-align: center;
            }
            
            .formino-popup-button {
                background: #008060;
                color: white;
                border: none;
                padding: 12px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
            }
            
            .formino-popup-button:hover {
                background: #006c4f;
                transform: translateY(-1px);
            }
            
            .formino-popup-button:active {
                transform: translateY(0);
            }

             .formino-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: formino-spin 1s ease-in-out infinite;
                margin-left: 10px;
            }
            
            .formino-submit-button.loading .formino-spinner {
                display: inline-block;
            }
            
            .formino-submit-button:not(.loading) .formino-spinner {
                display: none;
            }
            
            @keyframes formino-spin {
                to { transform: rotate(360deg); }
            }
            
            .formino-submit-button.loading {
                opacity: 0.9;
                cursor: wait;
            }
            
            .formino-submit-button.loading svg {
                opacity: 0.5;
            }

        `;

        document.head.appendChild(style);
    }

    setupPopupHandlers() {
        const popup = document.getElementById('formino-thankyou-popup');
        if (!popup) return;

        const closeBtn = popup.querySelector('.formino-popup-close');
        const okBtn = popup.querySelector('#formino-popup-ok');
        const overlay = popup.querySelector('.formino-popup-overlay');

        const closePopup = () => {
            popup.style.animation = 'forminoPopupSlideOut 0.3s ease-in';
            setTimeout(() => {
                this.removeExistingPopup();
            }, 300);
        };

        if (!document.querySelector('#formino-popup-animations')) {
            const animationStyle = document.createElement('style');
            animationStyle.id = 'formino-popup-animations';
            animationStyle.textContent = `
                @keyframes forminoPopupSlideOut {
                    from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    }
                    to {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                    }
                }
            `;
            document.head.appendChild(animationStyle);
        }

        closeBtn?.addEventListener('click', closePopup);
        okBtn?.addEventListener('click', closePopup);
        overlay?.addEventListener('click', closePopup);

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closePopup();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        popup.addEventListener('animationend', function handler(e) {
            if (e.animationName === 'forminoPopupSlideOut') {
                document.removeEventListener('keydown', handleEscape);
                popup.removeEventListener('animationend', handler);
            }
        });
    }

    resetForm() {
        const form = document.getElementById('formino-main-form');
        if (!form) return;

        const inputs = form.querySelectorAll('.formino-input');
        inputs.forEach(input => {
            input.value = '';
            const parent = input.closest('.formino-group-input');
            if (parent) parent.classList.remove('error');
        });

        form.querySelectorAll('.formino-error-message').forEach(m => m.remove());

        const submitButton = form.querySelector('.formino-submit-button');
        if (submitButton) {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;

            submitButton.style.color = "rgba(255,255,255,1)";

            submitButton.style.backgroundColor = "rgba(0,0,0,1)";
        }

        this.updateFormTotals();
    }

    applySubmitButtonStyles() {
        const btn = document.querySelector('.formino-submit-button');
        if (!btn || !this.configButton) return;

        const s = this.configButton;

        btn.style.backgroundColor = s.backgroundColor;
        btn.style.color = s.textColor;
        btn.style.fontSize = s.fontSize + 'px';
        btn.style.borderRadius = s.borderRadius + 'px';
        btn.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
        btn.style.width = '100%';
    }

    extractIdFromGid(gid) {
        if (!gid || typeof gid !== 'string') return null;

        if (gid.startsWith('gid://')) {
            const parts = gid.split('/');
            return parts[parts.length - 1];
        }

        return gid.toString();
    }

    closePopupModal() {
        if (this.config.form.formType !== 'EMBEDDED' && !this.downsellShown && this.downsells && this.downsells.length > 0) {
            const downsellOffer = this.getMatchingDownsell();
            if (downsellOffer) {
                this.showDownsellPopup(downsellOffer);
                this.downsellShown = true;
                return;
            }
        }

        const modalOverlay = document.getElementById('formino-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.animation = 'forminoPopupSlideOut 0.3s ease-in';
            setTimeout(() => {
                modalOverlay.remove();
                this.isFormOpen = false;
                this.downsellShown = false;
                this.activeDiscount = null;
                this.originalFormHTML = null;
            }, 300);
        }
    }

    getMatchingDownsell() {
        if (!this.detector.currentProduct) return null;
        const currentId = this.detector.currentProduct.id.toString();

        return this.downsells.find(offer => {
            const offerProductId = this.extractIdFromGid(offer.productSettings.productId);
            return offerProductId === currentId && offer.status === 'ACTIVE';
        });
    }

    showDownsellPopup(offer) {

        const contentDiv = document.querySelector('.formino-modal-content');
        if (!contentDiv) {
            console.error('❌ No modal content found');
            return;
        }

        if (!this.originalFormHTML) {
            this.originalFormHTML = contentDiv.innerHTML;
        }

        const styles = offer.designSettings;
        let discountDisplay = "";

        const discountText = styles.primaryBtn.text;
        const discountType = offer.productSettings.discountType;
        const discountValue = offer.productSettings.discountValue;
        let replacementValue = "";
        if (discountType === "PERCENTAGE") {
            replacementValue = discountValue + "%";
        } else {
            replacementValue = this.formatMoney(discountValue);
        }

        const finalButtonText = discountText.replace(/{discount}/g, replacementValue);

        if (offer.productSettings.discountType === 'PERCENTAGE') {
            discountDisplay = `${offer.productSettings.discountValue}% OFF`;
        } else {
            discountDisplay = `-${offer.productSettings.discountValue} ${Shopify.currency.active}`;
        }

        const downsellHTML = `
            <div 
                class="formino-downsell-container" 
                style="
                    background: #FFF; 
                    text-align: center; 
                    padding: 25px; 
                    max-width: 430px; 
                    margin: 0 auto;
                    border-radius: 8px;
                "
            >               
                <h2     
                    style="
                        color: ${styles.titleColor?.color}; 
                        font-size: ${styles.titleFontSize}px; 
                        margin-bottom: 5px;
                    "
                >
                    ${styles.title || 'Wait! Special Offer'}
                </h2>
                
                <p 
                    style="
                    color: ${styles.subtitleColor?.color || '#555'}; 
                    font-size: 16px; 
                    margin-bottom: 25px;
                    "
                >
                    ${styles.subtitle}
                </p>
                
                <div 
                    style="
                        display: flex;
                        justify-content: center;
                        width: 100%;
                        margin: 0px 0px 15px;
                    "
                >
                    <div 
                        style="
                            background: ${this.hsbToRgba(styles.plaque.bg)}; 
                            color:  ${this.hsbToRgba(styles.plaque.color)}; 
                            width: 135px !important;
                            height: 135px !important;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            font-size: 18px;
                            font-weight: bold;
                            clip-path: polygon(50% 0%, 58.64% 9.34%, 70.34% 4.32%, 74.43% 16.37%, 87.16% 16.54%, 86% 29.21%, 97.55% 34.55%, 91.34% 45.65%, 99.73% 55.23%, 89.54% 62.85%, 93.30% 75%, 80.89% 77.82%, 79.39% 90.45%, 66.91% 87.98%, 60.40% 98.91%, 50% 91.57%, 39.60% 98.91%, 33.09% 87.98%, 20.61% 90.45%, 19.11% 77.82%, 6.70% 75%, 10.46% 62.85%, 0.27% 55.23%, 8.66% 45.65%, 2.45% 34.55%, 14% 29.21%, 12.84% 16.54%, 25.57% 16.37%, 29.66% 4.32%, 41.36% 9.34%);"
                        >
                        ${styles.plaque.text}
                    </div>
                </div>

                <div style="display: flex; gap: 15px; flex-direction: column;">
                    <button type="button" id="accept-downsell" 
                        style="
                            background: ${this.hsbToRgba(styles.primaryBtn.backgroundColor)}; 
                            color: ${this.hsbToRgba(styles.primaryBtn.textColor)}; 
                            border: none; 
                            padding: 18px; 
                            border-radius: ${styles.primaryBtn.borderRadius}px;
                            cursor: pointer; 
                            font-weight: bold; 
                            font-size: ${styles.primaryBtn.fontSize}px;
                            border: ${styles.primaryBtn.borderWidth}px solid ${this.hsbToRgba(styles.primaryBtn.borderColor)};
                            transition: all 0.3s;"
                        >
                        ${finalButtonText}
                    </button>
                    
                    <button type="button" id="decline-downsell" 
                        style="
                            background: ${this.hsbToRgba(styles.secondaryBtn.backgroundColor)}; 
                            color: ${this.hsbToRgba(styles.secondaryBtn.textColor)}; 
                            border: none; 
                            padding: 18px; 
                            border-radius: ${styles.secondaryBtn.borderRadius}px;
                            cursor: pointer; 
                            font-weight: bold; 
                            font-size: ${styles.secondaryBtn.fontSize}px;
                            border: ${styles.secondaryBtn.borderWidth}px solid ${this.hsbToRgba(styles.secondaryBtn.borderColor)};
                            transition: all 0.3s;"
                        >
                        ${styles.secondaryBtn.text}
                    </button>
                </div>
            </div>
        `;

        contentDiv.innerHTML = downsellHTML;

        document.getElementById('accept-downsell').onclick = () => {
            this.applyDownsellDiscount(offer);
        };

        document.getElementById('decline-downsell').onclick = () => {
            this.closePopupModal(true);
            location.reload();
        };

        const closeBtn = document.getElementById('close-downsell-early');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.closePopupModal(true);
            };
        }

        this.applySubmitButtonStyles();

    }

    applyDownsellDiscount(offer) {
        const originalPriceUnit = this.detector.getCurrentPrice() / 100;
        let newPriceUnit = originalPriceUnit;

        if (offer.productSettings.discountType === 'PERCENTAGE') {
            newPriceUnit = originalPriceUnit - (originalPriceUnit * (parseFloat(offer.productSettings.discountValue) / 100));
        } else {
            newPriceUnit = originalPriceUnit - parseFloat(offer.productSettings.discountValue);
        }

        this.activeDiscount = {
            id: offer.id,
            newPrice: Math.max(0, newPriceUnit),
            originalPrice: originalPriceUnit
        };

        const contentDiv = document.querySelector('.formino-modal-content');
        if (contentDiv && this.originalFormHTML) {
            contentDiv.innerHTML = this.originalFormHTML;
            this.resetForm();
            this.setupFormHandlers();
            this.updateFormTotals();
            this.applyFormStyles();
            this.applySubmitButtonStyles();
        }
    }

    resetForm() {
        const form = document.getElementById('formino-main-form');
        if (!form) return;

        const inputs = form.querySelectorAll('.formino-input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });

        const errorGroups = form.querySelectorAll('.formino-group-input.error, .formino-field.error');
        errorGroups.forEach(group => {
            group.classList.remove('error');
        });

        const errorMessages = form.querySelectorAll('.formino-error-message');
        errorMessages.forEach(msg => msg.remove());

        this.currentQuantity = 1;

        this.updateFormTotals();

        const submitButton = form.querySelector('.formino-submit-button');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            // submitButton.style.color = '';
        }
    }

    injectSuccessBar(message) {
        const header = document.querySelector('.formino-header');
        if (header) {
            const oldBar = document.querySelector('.formino-discount-bar');
            if (oldBar) oldBar.remove();

            const bar = document.createElement('div');
            bar.className = 'formino-discount-bar';
            bar.style.cssText = "background:#dcfce7; color:#166534; padding:10px; text-align:center; font-weight:bold; border-radius:4px; margin:10px 0; border:1px solid #bbf7d0;";
            bar.innerText = message;
            header.after(bar);
        }
    }

    handleQuantityOffers() {
        if (!this.config.offers || !this.config.offers.quantityOffers) {
            return;
        }

        const currentProductId = this.detector.currentProduct?.id?.toString();
        if (!currentProductId) {
            return;
        }

        const matchingOffer = this.findMatchingQuantityOffer(currentProductId);

        if (matchingOffer) {
            setTimeout(() => {
                this.renderQuantityOffers(matchingOffer);
            }, 500);
        }
    }

    findMatchingQuantityOffer(currentProductId) {
        if (!this.config.offers || !this.config.offers.quantityOffers) {
            return null;
        }

        const offers = this.config.offers.quantityOffers;

        for (const offer of offers) {
            if (offer.status !== "ACTIVE") {
                continue;
            }

            if (!offer.productSettings || !offer.productSettings.productIds) {
                continue;
            }

            const isMatch = offer.productSettings.productIds.some(productGid => {
                const offerProductId = this.extractIdFromGid(productGid);
                const currentId = currentProductId.toString();

                return offerProductId === currentId;
            });

            if (isMatch) {
                this.activeQuantityOffer = offer;
                return offer;
            }
        }

        return null;
    }

    renderQuantityOffers(offer) {
        const upsellSection = document.querySelector('.formino-upsell-section');
        if (upsellSection) {
            this.renderQuantityOffersInContainer(offer, upsellSection);
            upsellSection.style.display = "block";
            return;
        }
    }

    renderQuantityOffersInContainer(offer, container) {
        container.innerHTML = '';
        const design = offer.designSettings || {};
        const offersContainer = document.createElement('div');
        offersContainer.className = 'formino-quantity-offers-container';
        offersContainer.id = `formino-quantity-offers-${offer.id}`;
        offersContainer.style.cssText = `
            border-radius: 8px;
            padding: 0;
        `;
        if (offer.name && offer.name.trim()) {
            const titleEl = document.createElement('div');
            titleEl.className = 'formino-quantity-offer-title';
            titleEl.style.cssText = `
            font-weight: bold;
            font-size: 16px;
        `;
            titleEl.textContent = offer.name || 'Quantity Offer';
            offersContainer.appendChild(titleEl);
        }
        offer.tiers.forEach((tier, index) => {
            const tierEl = this.createTierElement(tier, design, index === 0);
            offersContainer.appendChild(tierEl);
        });
        container.appendChild(offersContainer);
        this.applyQuantityOffersStyles();
        this.setupQuantityOfferHandlers(offer.id);
    }

    /**
     * Create Element tier quantity offer
     */
    createTierElement(tier, design, isFirst) {
        const tierEl = document.createElement('div');
        tierEl.className = `formino-tier-item ${tier.isPreselected ? 'selected' : ''}`;
        tierEl.dataset.tierId = tier.id || tier.quantity;
        tierEl.dataset.quantity = tier.quantity;
        tierEl.dataset.discountType = tier.discountType;
        tierEl.dataset.discountValue = tier.discountValue;

        const applyStyles = (isHover = false) => {
            const isSelected = tierEl.classList.contains('selected');
            const borderColor = this.rgbaToString(design.borderColor);
            const bgColor = this.rgbaToString(design.bgColor);

            tierEl.style.padding = '10px 12px';
            tierEl.style.borderRadius = '8px';
            tierEl.style.position = 'relative';
            tierEl.style.cursor = 'pointer';
            tierEl.style.marginBottom = '10px';
            tierEl.style.display = 'flex';
            tierEl.style.alignItems = 'center';

            if (isSelected) {
                tierEl.style.backgroundColor = bgColor;
                tierEl.style.border = `3px solid ${borderColor}`;
            } else if (isHover) {
                tierEl.style.backgroundColor = bgColor;
                tierEl.style.border = `3px solid silver`;
            } else {
                tierEl.style.backgroundColor = '#ffffff';
                tierEl.style.border = '3px solid silver';
            }
        };

        applyStyles();

        tierEl.onmouseenter = () => applyStyles(true);
        tierEl.onmouseleave = () => applyStyles(false);
        tierEl.onclick = () => this.selectTier(tier, tierEl);

        const originalPrice = this.detector.getCurrentPrice() / 100;
        const discountValue = parseFloat(tier.discountValue);
        let finalPrice = originalPrice * tier.quantity;
        let discountText = '';

        if (tier.discountType === "PERCENTAGE") {
            finalPrice = finalPrice * (1 - discountValue / 100);
            discountText = `${discountValue}% OFF`;
        } else if (tier.discountType === "FIXED_AMOUNT") {
            finalPrice = finalPrice - discountValue;
            discountText = `-${this.formatMoney(discountValue)}`;
        }

        tierEl.innerHTML = `
            ${!design.hideProductImage ? `
                <div style="width: 60px; height: 60px; margin-right: 12px; flex-shrink: 0; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <img src="${tier.imageUrl || this.detector.currentProduct?.featured_image || ''}" 
                        style="width: 100%; height: 100%; object-fit: cover;"
                        onerror="this.parentElement.style.display='none'">
                </div>
            ` : ''}

            <div style="flex: 1; min-width: 0;">
                <div style="color: #333; font-weight: 700; font-size: 13px; margin-bottom: 2px;">
                    ${tier.title || `${tier.quantity} × ${this.detector.currentProduct?.title || 'Product'}`}
                </div>
                
                ${tier.plaqueText ? `
                    <span style="display: inline-block; background-color: ${this.rgbaToString(tier.plaqueBgColor || { hue: 120, saturation: 100, brightness: 40 })}; 
                                color: ${this.rgbaToString(tier.plaqueTextColor || { hue: 0, saturation: 0, brightness: 100 })}; 
                                padding: 2px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase;
                                border-radius: 20px; margin-top: 4px;">
                        ${tier.plaqueText}
                    </span>
                ` : ''}
            </div>
            
            <div style="text-align: right; margin-left: 10px; flex-shrink: 0;">
                ${!design.hideComparisonPrice && !tier.hideComparisonPrice ? `
                    <div style="color: #999; text-decoration: line-through; font-size: 12px;">
                        ${this.formatMoney(originalPrice * tier.quantity)}
                    </div>
                ` : ''}
                
                <div style="font-size: 14px; font-weight: 800; color: ${this.rgbaToString(tier.priceColor || design.priceColor || { hue: 0, saturation: 0, brightness: 0 })};">
                    ${this.formatMoney(finalPrice)}
                </div>
                
                ${discountText ? `
                    <div style="font-size: 11px; color: ${this.rgbaToString(design.saveTextColor || { hue: 0, saturation: 80, brightness: 50 })}; font-weight: 600;">
                        ${discountText}
                    </div>
                ` : ''}
            </div>

            <div class="tier-checkbox" style="position: absolute; top: -10px; right: 0px; display: ${tier.isPreselected ? 'block' : 'none'};">
                <div style="background: ${this.rgbaToString(design.borderColor)}; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ✓
                </div>
            </div>
        `;

        if (tier.isPreselected) {
            setTimeout(() => this.selectTier(tier, tierEl), 10);
        }

        return tierEl;
    }

    /**
     * Select Offer in quantity offer
     */
    selectTier(tier, element) {
        const design = this.activeQuantityOffer?.designSettings || {};

        document.querySelectorAll('.formino-tier-item').forEach(el => {
            el.classList.remove('selected');
            const cb = el.querySelector('.tier-checkbox');
            if (cb) cb.style.display = 'none';
            el.style.backgroundColor = '#ffffff';
            el.style.border = '3px solid silver';
        });

        element.classList.add('selected');
        element.style.backgroundColor = this.rgbaToString(design.bgColor);
        element.style.border = `3px solid ${this.rgbaToString(design.borderColor)}`;

        const checkbox = element.querySelector('.tier-checkbox');
        if (checkbox) checkbox.style.display = 'block';

        this.currentQuantity = parseInt(tier.quantity) || 1;
        this.activeQuantityTier = tier;
        if (typeof this.updateFormTotals === 'function') {
            this.updateFormTotals();
        }
    }

    rgbaToString(color) {
        if (!color || typeof color !== 'object') {
            return 'transparent';
        }

        const h = color.hue || 0;
        const s = color.saturation || 0;
        const b = color.brightness || 0;
        const a = color.alpha !== undefined ? color.alpha : 1;

        const rgb = this.hsbToRgba({ hue: h, saturation: s, brightness: b, alpha: a });

        return rgb;
    }

    updateFormTotals() {
        const unitPrice = this.detector.getCurrentPrice() / 100;
        let subtotal = unitPrice;
        let discountAmount = 0;
        let subtotalUnit = subtotal;

        if (this.activeQuantityTier) {
            const quantity = this.activeQuantityTier.quantity;
            const originalTotal = unitPrice * quantity;
            const discountValue = parseFloat(this.activeQuantityTier.discountValue);
            subtotalUnit = subtotalUnit * quantity;
            if (this.activeQuantityTier.discountType === "PERCENTAGE") {
                subtotal = originalTotal * (1 - discountValue / 100);
            } else if (this.activeQuantityTier.discountType === "FIXED_AMOUNT") {
                subtotal = originalTotal - discountValue;
            } else {
                subtotal = originalTotal;
            }

            subtotal = Math.max(0, subtotal);
            discountAmount = originalTotal - subtotal;
        }

        if (this.activeDiscount) {
            const priceBeforeActiveDiscount = subtotal;
            subtotal = this.activeDiscount.newPrice;
            discountAmount += (priceBeforeActiveDiscount - subtotal);
        }

        const shipping = this.currentShipping ? this.currentShipping.price : 0;
        const total = subtotal + shipping;

        const elements = {
            '.formino-subtotal': this.formatMoney(subtotalUnit),
            '.formino-shipping-cost': shipping === 0 ? 'Free' : this.formatMoney(shipping),
            '.formino-total-amount': this.formatMoney(total),
            '.formino-dynamic-total': this.formatMoney(total),
            '.formino-dynamic-subtotal': this.formatMoney(subtotal)
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const el = document.querySelector(selector);
            if (el) el.textContent = value;
        });

        const discountLine = document.querySelector('.formino-discount-cost')?.parentElement;
        const discountValueEl = document.querySelector('.formino-discount-cost');

        if (discountLine && discountValueEl) {
            if (discountAmount > 0) {
                discountLine.style.display = 'flex';
                discountValueEl.textContent = `-${this.formatMoney(discountAmount)}`;
                discountValueEl.style.color = 'rgb(229 6 39)';
                discountValueEl.style.fontWeight = '600';
            } else {
                discountLine.style.display = 'none';
            }
        }

        if (this.activeQuantityTier && discountAmount > 0) {
            const totalAmountEl = document.querySelector('.formino-total-amount');
            if (totalAmountEl) {
                totalAmountEl.innerHTML = `
                ${this.formatMoney(total)}
            `;
            }
        }
    }

    applyQuantityOffersStyles() {
        const styleId = 'formino-quantity-offers-styles';

        const oldStyle = document.getElementById(styleId);
        if (oldStyle) oldStyle.remove();

        const style = document.createElement('style');
        style.id = styleId;

        style.textContent = `
            .formino-quantity-offers-container {
                animation: fadeIn 0.3s ease-in;
            }
            
            .formino-tier-item.selected {
                position: relative;
            }
        
            .formino-tier-item .tier-checkbox {
                transition: all 0.2s ease;
            }
            
        `;

        document.head.appendChild(style);
    }

    setupQuantityOfferHandlers(offerId) {
        const tierItems = document.querySelectorAll('.formino-tier-item');

        tierItems.forEach(item => {
            item.addEventListener('click', (e) => {

                if (item.classList.contains('selected')) {
                    return;
                }

                const tierData = {
                    quantity: parseInt(item.dataset.quantity),
                    discountType: item.dataset.discountType,
                    discountValue: parseFloat(item.dataset.discountValue)
                };

                this.selectTier(tierData, item);
            });
        });
    }














    /**
     * عرض نافذة منبثقة لعروض الـ Upsell بعد إرسال الطلب
     * @param {Object} upsellOffer - بيانات عرض الـ Upsell
     * @param {Object} orderResult - نتيجة الطلب المرسل
     */
    showUpsellPopup(upsellOffer, orderResult) {
        try {
            const productHandle = upsellOffer.productSettings.upsellProductHandle;

            if (!productHandle) {
                this.showSuccessMessage(orderResult);
                return;
            }

            this.createCustomPopup({
                type: 'info',
                message: 'Loading upsell offer...'
            });

            this.fetchProductByHandle(productHandle)
                .then(productData => {
                    this.removeExistingPopup();
                    this.renderUpsellPopup(upsellOffer, productData, orderResult);
                })
                .catch(error => {
                    console.error('❌ Error fetching upsell product:', error);
                    this.showSuccessMessage(orderResult);
                });

        } catch (error) {
            console.error('❌ Error in showUpsellPopup:', error);
            this.showSuccessMessage(orderResult);
        }
    }

    /**
     * جلب بيانات المنتج باستخدام handle
     */
    async fetchProductByHandle(productHandle) {
        try {

            const response = await fetch(`/products/${productHandle}.js`);

            if (response.ok) {
                const productData = await response.json();
                return productData;
            } else {
                console.error(`❌ Failed to fetch product: ${response.status}`);
                throw new Error(`Product not found: ${productHandle}`);
            }
        } catch (error) {
            console.error('❌ Error fetching product:', error);
            throw error;
        }
    }

    /**
     * عرض نافذة الـ Upsell مع بيانات المنتج
     * @param {Object} upsellOffer - بيانات العرض
     * @param {Object} productData - بيانات المنتج
     * @param {Object} orderResult - نتيجة الطلب
     */
    renderUpsellPopup(upsellOffer, productData, orderResult) {
        // حفظ البيانات للاستخدام اللاحق
        this.currentUpsellData = {
            offer: upsellOffer,
            product: productData,
            orderResult: orderResult
        };

        // إعداد التصميم
        const design = upsellOffer.designSettings;
        const productSettings = upsellOffer.productSettings;

        // حساب السعر بعد الخصم
        const originalPrice = productSettings.price;
        let discountedPrice = originalPrice;
        let discountDisplay = '';

        if (productSettings.discount.type === 'PERCENTAGE') {
            const discountPercent = parseFloat(productSettings.discount.value);
            discountedPrice = originalPrice * (1 - discountPercent / 100);
            discountDisplay = `${discountPercent}% OFF`;
        } else {
            const discountAmount = parseFloat(productSettings.discount.value);
            discountedPrice = originalPrice - discountAmount;
            discountDisplay = `-${this.formatMoney(discountAmount)}`;
        }

        // استبدال العناصر النائبة في العنوان
        let title = design.title || 'Add {product_name} to your order!';
        title = title.replace(/{product_name}/g, productData.title);

        // التحقق مما إذا كان المنتج يحتوي على متغيرات
        const hasVariants = productData.variants && productData.variants.length > 1;
        let variantsHTML = '';

        if (hasVariants) {
            variantsHTML = `
            <div class="formino-upsell-variants" style="margin: 15px 0;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                    Select Variant
                </label>
                <select id="upsell-variant-select" 
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                    ${productData.variants.map(variant => `
                        <option value="${variant.id}" 
                                ${variant.available ? '' : 'disabled'}
                                data-price="${variant.price}">
                            ${variant.title || 'Default'} - ${this.formatMoney(variant.price / 100)}
                            ${!variant.available ? ' (Out of stock)' : ''}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
        }

        // HTML للنافذة المنبثقة
        const upsellHTML = `
        <div class="formino-upsell-overlay" id="formino-upsell-overlay" 
             style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; 
                    justify-content: center; z-index: 99999;">
            
            <div class="formino-upsell-container" 
                style="
                background: white; 
                border-radius: 12px; 
                max-width: 420px; 
                width: 90%; 
                max-height: 95vh; 
                overflow-y: auto; 
                padding: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
                position: relative;"
            >
                
                <button 
                    type="button" 
                    class="formino-upsell-close" 
                        style="
                            position: absolute; 
                            top: 15px; 
                            right: 15px; 
                            background: none; 
                            border: none; 
                            font-size: 24px; 
                            cursor: pointer; 
                            color: #666; 
                            width: 30px; 
                            height: 30px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            border-radius: 50%; 
                            transition: all 0.2s;
                        " 
                        onmouseover="this.style.background='#f5f5f5'; this.style.color='#333';"
                        onmouseout="this.style.background='none'; this.style.color='#666';"
                    >
                    &times;
                </button>
                
                <h2 class="formino-upsell-title" 
                    style="
                        color: ${design.titleColor || '#333'}; 
                        font-size: 20px; 
                        font-weight: 700; 
                        margin-bottom: 15px; 
                        text-align: center;"
                >
                    ${title}
                </h2>
                
                ${design.subtitle ? `
                    <p  class="formino-upsell-subtitle" 
                        style="
                            color: ${design.subtitleColor || '#666'}; 
                            font-size: 16px; 
                            margin-bottom: 20px; 
                            text-align: center;"
                        >
                        ${design.subtitle}
                    </p>
                ` : ''}
                
                ${design.image?.show !== false ? `
                    <div 
                        class="formino-upsell-image" 
                        style="
                            text-align: center; 
                            height: 250px;
                            overflow: hidden;
                            width: 250px;
                            margin: 0px auto;
                        >
                        <img 
                            src="${productData.featured_image || productData.images?.[0]?.src || ''}" 
                            alt="${productData.title}" 
                            style="
                                max-width: 100%; 
                                width: 100%; 
                                height: auto; 
                                border: 1px solid #eee;
                                border-radius: ${design.image?.borderRadius || 8}px;
                                ${design.image?.shadow ? 'box-shadow: 0 5px 15px rgba(0,0,0,0.1)' : ''};"
                        >
                    </div>
                ` : ''}
                
                ${design.productTitle !== false ? `
                    <h3 class="formino-upsell-product-title" 
                        style="
                            color: #333; 
                            font-size: 18px; 
                            font-weight: 600; 
                            margin-bottom: 10px; 
                            text-align: left;"
                    >
                        ${productData.title}
                    </h3>
                ` : ''}
                
                ${(design.productDescription && productData.description) ? `
                    <div class="formino-upsell-description" 
                        style="
                            color: #666; 
                            font-size: 14px; 
                            margin-bottom: 15px; 
                            text-align: center; 
                            line-height: 1.5;
                        "
                        >
                        ${productData.description.substring(0, 150)}${productData.description.length > 150 ? '...' : ''}
                    </div>
                ` : ''}
                
                ${variantsHTML}
                
                <div 
                    class="formino-upsell-pricing" 
                    style="
                        margin: 0px; 
                        text-align: left;
                        display: flex;
                    "
                >
                    <div class="formino-upsell-discounted-price" 
                        style="
                            color: ${design.priceColor || '#d32f2f'}; 
                            font-size: 20px; 
                            font-weight: 700;
                        "
                    >
                        ${this.formatMoney(discountedPrice)}
                    </div>
                    <div 
                        class="formino-upsell-original-price" 
                        style="
                            color: #999; 
                            text-decoration: line-through; 
                            font-size: 16px; 
                            margin-bottom: 0px;
                            position: relative;
                            top: 5px;
                            left: 10px;
                            font-weight: 600;
                        "
                        >
                        ${this.formatMoney(originalPrice)}
                    </div>
                </div>

                <div 
                    class="formino-upsell-discount-badge" 
                    style="
                        display: inline-block; 
                        background: #ff4444; 
                        color: white; 
                        padding: 4px 12px; 
                        border-radius: 20px; 
                        font-size: 12px; 
                        font-weight: 600; 
                        margin-bottom: 15px;
                        margin-top: 8px;"
                    >
                    ${discountDisplay}
                </div>
                
                <div class="formino-upsell-buttons" 
                     style="display: flex; gap: 15px; flex-direction: column;">
                    
                    <button type="button" id="accept-upsell" 
                            class="formino-upsell-add-button"
                            style="background: ${design.addButton?.backgroundColor || '#000000'}; 
                                   color: ${design.addButton?.textColor || '#ffffff'}; 
                                   border: ${design.addButton?.borderWidth || 1}px solid ${design.addButton?.borderColor || '#000000'}; 
                                   border-radius: ${design.addButton?.borderRadius || 8}px; 
                                   padding: 16px; font-size: ${design.addButton?.fontSize || 16}px; 
                                   font-weight: 600; cursor: pointer; width: 100%; 
                                   transition: all 0.3s; display: flex; align-items: center; 
                                   justify-content: center; gap: 8px;"
                            onmouseover="this.style.opacity='0.9'"
                            onmouseout="this.style.opacity='1'">
                        ${design.addButton?.icon ? this.getButtonIcon(design.addButton.icon) : ''}
                        ${design.addButton?.text || 'Add to my order'}
                    </button>
                    
                    <button type="button" id="decline-upsell" 
                            class="formino-upsell-decline-button"
                            style="background: ${design.noButton?.backgroundColor || '#ffffff'}; 
                                   color: ${design.noButton?.textColor || '#000000'}; 
                                   border: ${design.noButton?.borderWidth || 1}px solid ${design.noButton?.borderColor || '#dddddd'}; 
                                   border-radius: ${design.noButton?.borderRadius || 8}px; 
                                   padding: 16px; font-size: ${design.noButton?.fontSize || 16}px; 
                                   font-weight: 600; cursor: pointer; width: 100%; 
                                   transition: all 0.3s;"
                            onmouseover="this.style.background='#f5f5f5'"
                            onmouseout="this.style.background='${design.noButton?.backgroundColor || '#ffffff'}'">
                        ${design.noButton?.text || 'No thank you, complete my order'}
                    </button>
                </div>
            </div>
        </div>
    `;

        // إضافة النافذة إلى DOM
        document.body.insertAdjacentHTML('beforeend', upsellHTML);

        // إعداد معالجات الأحداث
        this.setupUpsellPopupHandlers(upsellOffer, productData, orderResult);

        // إضافة تأثيرات الحركة
        setTimeout(() => {
            const container = document.querySelector('.formino-upsell-container');
            if (container) {
                container.style.transform = 'translateY(0)';
                container.style.opacity = '1';
            }
        }, 10);
    }

    /**
     * إعداد معالجات الأحداث للنافذة المنبثقة
     */
    setupUpsellPopupHandlers(upsellOffer, productData, orderResult) {
        const overlay = document.getElementById('formino-upsell-overlay');
        const closeBtn = overlay.querySelector('.formino-upsell-close');
        const acceptBtn = overlay.querySelector('#accept-upsell');
        const declineBtn = overlay.querySelector('#decline-upsell');
        const variantSelect = overlay.querySelector('#upsell-variant-select');

        // حفظ المتغير المختار
        let selectedVariantId = productData.variants[0]?.id;

        // تحديث المتغير المختار
        if (variantSelect) {
            variantSelect.addEventListener('change', (e) => {
                selectedVariantId = e.target.value;
            });
        }

        // إغلاق النافذة
        const closePopup = () => {
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
        };

        closeBtn?.addEventListener('click', closePopup);

        // النقر خارج المحتوى
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePopup();
            }
        });

        // زر رفض العرض
        declineBtn?.addEventListener('click', () => {
            closePopup();
            this.showSuccessMessage(orderResult);
        });

        // زر قبول العرض
        acceptBtn?.addEventListener('click', async () => {
            try {
                // تعطيل الزر أثناء المعالجة
                acceptBtn.disabled = true;
                acceptBtn.innerHTML = 'Adding to order...';

                // إضافة المنتج إلى الطلب
                await this.addUpsellToOrder(upsellOffer, selectedVariantId, orderResult);

                // إغلاق النافذة
                closePopup();

            } catch (error) {
                console.error('❌ Error adding upsell to order:', error);
                acceptBtn.disabled = false;
                acceptBtn.innerHTML = 'Add to my order';

                this.createCustomPopup({
                    type: 'error',
                    message: 'Failed to add product to your order. Please try again.'
                });
            }
        });

        // إغلاق بـ Escape
        document.addEventListener('keydown', function handleEscape(e) {
            if (e.key === 'Escape') {
                closePopup();
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }

    /**
 * إضافة منتج الـ Upsell إلى الطلب
 */
    async addUpsellToOrder(upsellOffer, selectedVariantId, originalOrderResult) {
        try {

            if (!originalOrderResult?.localOrder?.id) {
                throw new Error('Original order ID not found');
            }

            const productHandle = upsellOffer.productSettings?.upsellProductHandle;
            if (!productHandle) {
                throw new Error('Product handle not found in upsell offer');
            }

            let productData;
            try {
                productData = await this.fetchProductByHandle(productHandle);
            } catch (error) {
                console.error('❌ Failed to fetch product data, creating fallback data');
                productData = {
                    id: this.extractIdFromGid(upsellOffer.productSettings.upsellProductId) || 'unknown',
                    title: upsellOffer.name || 'Upsell Product',
                    handle: productHandle,
                    price: upsellOffer.productSettings.calculatedPrice * 100, // تحويل إلى سنتات
                    featured_image: '',
                    variants: [
                        {
                            id: selectedVariantId,
                            price: upsellOffer.productSettings.calculatedPrice * 100,
                            title: 'Default',
                            available: true
                        }
                    ]
                };
            }

            // التحقق من بيانات المنتج
            if (!productData || !productData.id) {
                console.error('❌ Invalid product data:', productData);
                throw new Error('Invalid product data received');
            }

            const discount = upsellOffer.productSettings?.discount;
            if (!discount) {
                throw new Error('Discount information not found');
            }

            // حساب السعر النهائي
            let finalPrice;
            if (upsellOffer.productSettings.calculatedPrice) {
                // استخدام calculatedPrice إذا كان متوفراً
                finalPrice = upsellOffer.productSettings.calculatedPrice / 100;
            } else if (discount.type === 'PERCENTAGE') {
                const originalPrice = upsellOffer.productSettings.price / 100;
                const discountPercent = parseFloat(discount.value);
                finalPrice = originalPrice * (1 - discountPercent / 100);
            } else {
                finalPrice = upsellOffer.productSettings.price / 100;
            }

            // إعداد بيانات الطلب
            const orderData = {
                shop: window.Shopify?.shop || this.extractShopFromDOM() || window.location.hostname,
                product: {
                    id: productData.id,
                    title: productData.title,
                    handle: productHandle,
                    price: finalPrice,
                    featured_image: productData.featured_image || '',
                    variants: productData.variants || [],
                    calculatedPrice: upsellOffer.productSettings.calculatedPrice,
                    originalPrice: upsellOffer.productSettings.price
                },
                variantId: selectedVariantId,
                quantity: 1,
                discount: discount,
                originalOrderId: originalOrderResult.localOrder.id,
                upsellId: upsellOffer.id
            };

            // محاولة الحصول على IP العميل
            try {
                orderData.clientIP = await this.getClientIP();
            } catch (ipError) {
                orderData.clientIP = 'unknown';
            }

            const response = await fetch(`${this.apiBaseUrl}/api/add-upsell-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API response error:', errorText);
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {

                this.createCustomPopup({
                    type: 'success',
                    message: `✅ ${productData.title} has been added to your order!`
                });

                setTimeout(() => {
                    this.showSuccessMessage(originalOrderResult);
                }, 2000);

            } else {
                console.error('❌ API returned failure:', result);
                throw new Error(result.error || result.message || 'Failed to add upsell product');
            }

        } catch (error) {
            console.error('❌ Error in addUpsellToOrder:', error);
            this.createCustomPopup({
                type: 'error',
                message: error.message || 'Failed to add product to your order. Please try again.'
            });
            const acceptBtn = document.querySelector('#accept-upsell');
            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.innerHTML = 'Add to my order';
            }
            setTimeout(() => {
                this.showSuccessMessage(originalOrderResult);
            }, 3000);
        }
    }

    async getClientIP() {
        // try {
        //     // محاولة الحصول على IP من خدمة خارجية
        //     const response = await fetch('https://api.ipify.org?format=json', {
        //         method: 'GET',
        //         headers: {
        //             'Accept': 'application/json'
        //         }
        //     });

        //     if (response.ok) {
        //         const data = await response.json();
        //         return data.ip;
        //     }
        // } catch (error) {
        //     console.log('⚠️ Could not fetch IP, using default');
        // }

        return '1.1.0.1';
    }



















}

document.addEventListener('DOMContentLoaded', function () {
    new ProductFormBuilder();
});