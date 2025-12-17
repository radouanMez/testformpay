console.log("CODFORMPAY V.1.0.3");

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
        // الكشف عن صفحة المنتج فقط
        this.isProductPage = path.includes('/products/');
        return this.isProductPage;
    }

    async extractProductData() {
        if (!this.isProductPage) return null;

        // 1. جلب الـ handle من الـ URL
        const productHandle = this.getProductHandleFromURL();
        if (!productHandle) return null;

        try {
            // 2. جلب بيانات المنتج من Shopify API
            const response = await fetch(`/products/${productHandle}.js`);
            if (response.ok) {
                const productData = await response.json();
                this.currentProduct = productData;

                // 3. استخراج الـ variant الافتراضي (الأول)
                this.currentVariantId = productData.variants[0]?.id;

                // 4. البحث عن الـ variant المحدد حالياً في الصفحة
                this.detectCurrentVariant();

                this.notifyObservers({
                    type: 'product_loaded',
                    product: this.currentProduct,
                    variantId: this.currentVariantId
                });

                return productData;
            }
        } catch (error) {
            console.error('Error fetching product:', error);
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
            // يبحث عن العنصر الذي يحتوي على معرف الـ variant الحالي
            const variantInput = document.querySelector('[name="id"], [data-product-variant-id]');
            if (variantInput && variantInput.value) {
                return variantInput.value;
            }

            // fallback من data أو الـ config
            if (this.currentProduct?.variants?.length) {
                const selected = this.currentProduct.variants.find(v => v.available);
                return selected ? selected.id : null;
            }

            console.warn("⚠️ No variant detected.");
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
        // مراقبة تغييرات الـ variants
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
        // مراقبة تغييرات الكمية
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
        // طريقة احتياطية إذا فشل جلب البيانات من API
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
        // استخراج product ID من الـ JSON في الصفحة
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

        this.init();
    }


    async init() {
        if (!this.detector.isProductPage) {
            return;
        }

        await this.detector.extractProductData();
        await this.fetchFormConfig();

        this.applyPopupModalStyles();

        // بناء الفورم حسب النوع
        if (this.config.form.formType === 'EMBEDDED') {
            this.createEmbeddedForm();
        } else {
            this.createPopupForm();
        }

        // إعداد الـ handlers بعد إنشاء الفورم مباشرة
        this.setupFormHandlers();
        this.setupValidation();

        await this.initializeCart();
        this.setupMonitoring();
    }

    async fetchFormConfig() {
        try {
            const shop = window.Shopify?.shop || this.extractShopFromDOM();
            const response = await fetch(`https://cod.formpaycod.com/api/public-form-config?shop=${shop}`);

            if (response.ok) {
                this.config = await response.json();

                if (this.config.shipping && this.config.shipping.length > 0) {
                    this.currentShipping = this.config.shipping[0];
                }
            }
        } catch (error) {
            console.error('Error fetching form config:', error);
            this.config = this.getDefaultConfig();
        }
    }

    createEmbeddedForm() {

        // 1️⃣ البحث عن الحاوية الأساسية الجاهزة
        let formContainer = document.getElementById('formino-cod-form');

        if (formContainer) {
            // console.log("✅ Found existing container #formino-cod-form");
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

            // 3️⃣ تحديد مكان الوضع
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
            console.error("❌ Formino: Error creating embedded form:", error);
            return false;
        }
    }

    createPopupForm() {
        // إنشاء زر لفتح البوب أب
        this.createPopupButton();

        // إنشاء البوب أب (سيخفي في البداية)
        this.createPopupModal();
    }

    createPopupButton() {
        const buyButton = this.config.form.buyButton;
        if (!buyButton) return;

        const iconHtml = buyButton.icon && buyButton.icon !== 'none' ? this.getButtonIcon(buyButton.icon) : '';

        const buttonHTML = `
          <div class="formino-block-popup-button">
            <button class="formino-popup-trigger" id="formino-popup-trigger">
              ${iconHtml}
              ${buyButton.text}
              ${buyButton.subtitle ? `<span class="formino-button-subtitle">${buyButton.subtitle}</span>` : ''}
            </button>
          </div>
      `;

        // المحاولة الأولى: إضافة قبل formino-cod-form
        const codForm = document.getElementById('formino-cod-form');
        if (codForm) {
            codForm.insertAdjacentHTML('beforebegin', buttonHTML);
        }
        // المحاولة الثانية: إضافة بعد زر Add to Cart
        else {
            const addToCartButton = document.querySelector('[name="add"], .add-to-cart, .product-form__submit');
            if (addToCartButton) {
                addToCartButton.insertAdjacentHTML('afterend', buttonHTML);
            }
            // المحاولة الثالثة: إضافة في نهاية body
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
            color: ${(buyButton.textColor)};
            background-color: ${(buyButton.backgroundColor)};
            border: ${buyButton.borderWidth}px solid ${(buyButton.borderColor)};
            ${buyButton.shadow ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.2)' : ''};
            padding: 12px 24px;
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

        // إذا كان الزر sticky
        if (buyButton.stickyPosition && buyButton.mobileSticky) {
            button.style.position = 'fixed';
            button.style[buyButton.stickyPosition] = '20px';
            button.style.zIndex = '1000';
        }
    }

    // 👇 أضف هنا الدالة داخل الكلاس
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
        // استخدام event delegation للزر
        document.addEventListener('click', (e) => {
            if (e.target.id === 'formino-popup-trigger' || e.target.closest('#formino-popup-trigger')) {
                this.openPopupModal();
            }
        });

        // إغلاق الـ modal عند النقر خارج المحتوى
        document.addEventListener('click', (e) => {
            const overlay = document.getElementById('formino-modal-overlay');
            if (overlay && e.target === overlay) {
                overlay.style.display = 'none';
                this.isFormOpen = false;
            }
        });
    }

    openPopupModal() {
        // إنشاء الـ modal إذا لم يكن موجوداً
        if (!document.getElementById('formino-modal-overlay')) {
            this.createPopupModal();
        }

        // عرض الـ modal
        const modalOverlay = document.getElementById('formino-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
            this.isFormOpen = true;

            // تحديث التوتالات عند فتح الـ modal
            this.updateFormTotals();
        }
    }

    createPopupModal() {
        // أولاً، إزالة أي modal موجود
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

        // 🔥 إضافة handlers الإغلاق بعد إنشاء الـ modal
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
            right: 15px;
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
            label = field.required ? label + ' *' : label;
        }

        return `
      <div class="formino-group-input">
      <label for="formino-field-${field.id}">${label}</label>
      <div class="formino-field formino-input-field" data-field-id="${field.id}">
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
      <div class="formino-error-message">${field.errorText}</div></div>
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
      <div class="formino-section formino-upsell-section" data-field-id="${field.id}">
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
              ${iconHtml}
              <span>${this.replacePlaceholders(settings.buttonText)}</span>
              ${settings.buttonSubtitle ?
                `<span class="formino-button-subtitle">${settings.buttonSubtitle}</span>` : ''}
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
          <span style="display: flex; align-items: center;">
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
          <span style="display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="currentColor">
              <path d="M11.128 4.123c-.453-.95-1.803-.95-2.256 0l-1.39 2.912-3.199.421c-1.042.138-1.46 1.422-.697 2.146l2.34 2.222-.587 3.172c-.192 1.034.901 1.828 1.825 1.327l2.836-1.54 2.836 1.54c.924.501 2.017-.293 1.825-1.327l-.587-3.172 2.34-2.222c.762-.724.345-2.008-.697-2.146l-3.2-.421-1.389-2.912Z" />
            </svg>
          </span>
          `
                );
            case 'truck':
                return (
                    `
          <span style="display: flex; align-items: center;">
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
          <span style="display: flex; align-items: center;">
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
          <span style="display: flex; align-items: center;">
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
      max-width: 500px !important;
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

    closePopupModal() {
        const modalOverlay = document.getElementById('formino-modal-overlay');
        if (modalOverlay) {
            // إضافة animation للإغلاق
            modalOverlay.style.animation = 'forminoPopupSlideOut 0.3s ease-in';

            setTimeout(() => {
                modalOverlay.remove();
                this.isFormOpen = false;
            }, 300);
        }
    }


    setupFormHandlers() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.formino-submit-button');
            if (!btn) return;

            const form = document.getElementById('formino-main-form');
            if (form && !form.contains(btn)) {
                e.preventDefault();
                form.requestSubmit();
            }
        });

        document.addEventListener('submit', async (e) => {
            if (e.target.id !== 'formino-main-form') return;
            e.preventDefault();

            const form = e.target;
            const btn = form.querySelector('.formino-submit-button');
            if (btn) btn.classList.add('loading');

            try {
                await this.handleFormSubmit(e);
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                this.createCustomPopup({
                    type: 'error',
                    message: '⚠️ Failed to send order. Please try again.'
                });
            } finally {
                if (btn) btn.classList.remove('loading');
            }
        });

        // 📌 3. Event delegation لتغييرات الشحن
        document.addEventListener('change', (e) => {
            if (e.target.name === 'shipping_method' && this.config?.shipping) {
                const selectedRate = this.config.shipping.find(rate => rate.id === e.target.value);
                if (selectedRate) {
                    this.currentShipping = selectedRate;
                    this.updateFormTotals();

                    // تأثير التحديد البصري
                    document.querySelectorAll('.formino-shipping-option').forEach(option => {
                        option.style.background = 'white';
                        option.style.borderColor = '#ddd';
                    });

                    const selectedOption = e.target.closest('.formino-shipping-option');
                    if (selectedOption) {
                        selectedOption.style.background = '#f8fff8';
                        selectedOption.style.borderColor = '#008060';
                    }
                }
            }
        });

        // 📌 4. (اختياري) أي أحداث إضافية مستقبلية (ex: تغيير Variant أو خصم)
        // document.addEventListener('change', (e) => {
        //   if (e.target.name === 'variant') this.updateFormTotals();
        // });

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
            console.warn("⚠️ Validation failed — please fill all required fields.");
            this.createCustomPopup({
                type: 'warning',
                message: 'Please fill in all required fields before submitting your order.'
            });
            return;
        }

        // ✅ 2. حالة التحميل على الزر
        const submitButton = form.querySelector('.formino-submit-button');
        if (submitButton) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            submitButton.style.color = 'transparent';
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

            this.showSuccessMessage(result);
        } catch (error) {
            console.error("❌ Error during submission:", error);
            this.showErrorMessage(error);
            this.createCustomPopup({
                type: 'error',
                message: 'Something went wrong while sending your order. Please try again.'
            });
        } finally {
            if (submitButton) {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                submitButton.style.color = this.configButton.textColor;
            }
        }
    }

    async submitOrder(payload = {}) {
        try {
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

            const product = payload.product || this.currentProduct || formData.product || {};
            formDataToSend.append('product', JSON.stringify(product));

            formDataToSend.append('variantId', payload.variantId || formData.variantId || '');
            formDataToSend.append('quantity', formData.quantity?.toString() || '1');

            const totals = {
                subtotal: payload.subtotal || this.currentSubtotal || 0,
                total: payload.total || this.calculateTotal?.() || this.currentSubtotal || 0,
                timestamp: new Date().toISOString()
            };
            formDataToSend.append('totals', JSON.stringify(totals));

            formDataToSend.append('config', JSON.stringify(this.config || {}));

            const response = await fetch(
                'https://cod.formpaycod.com/api/create-order',
                {
                    method: 'POST',
                    body: formDataToSend
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

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
        console.log(customMessage)
        const message = customMessage || 'Your order has been blocked due to security reasons. Please contact customer support if you believe this is an error.';
        console.log(message)
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

    updateFormTotals() {
        const subtotal = this.detector.getCurrentPrice() / 100;
        const shipping = this.currentShipping ? this.currentShipping.price : 0;
        const total = subtotal + shipping;

        // تحديث جميع العناصر
        const elements = {
            '.formino-subtotal': this.formatMoney(subtotal),
            '.formino-shipping-cost': shipping === 0 ? 'Free' : this.formatMoney(shipping),
            '.formino-total-amount': this.formatMoney(total),
            '.formino-dynamic-total': this.formatMoney(total),
            '.formino-dynamic-subtotal': this.formatMoney(subtotal)
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        });
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
            
            .formino-popup-close {
                position: absolute;
                content: "";
                background: none;
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
                top: 8px;
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

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
                input.value = '';
            } else if (input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
            }
        });

        const shippingRadios = form.querySelectorAll('input[name="shipping_method"]');
        if (shippingRadios.length > 0) {
            shippingRadios[0].checked = true;
            this.currentShipping = this.config?.shipping?.[0] || null;
        }

        const errorMessages = form.querySelectorAll('.formino-error-message');
        errorMessages.forEach(error => error.remove());

        const errorFields = form.querySelectorAll('.formino-field.error');
        errorFields.forEach(field => field.classList.remove('error'));

        // 5. إعادة تعيين الكمية إلى 1
        this.currentQuantity = 1;

        // 6. تحديث التوتالات
        this.updateFormTotals();

        // 7. إعادة تعيين زر الإرسال
        const submitButton = form.querySelector('.formino-submit-button');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }

    }

}



// بدء التشغيل
document.addEventListener('DOMContentLoaded', function () {
    new ProductFormBuilder();
});