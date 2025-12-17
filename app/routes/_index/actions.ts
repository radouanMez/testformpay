import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../../shopify.server";
import { prisma } from "../../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    try {
        let user = await prisma.user.findUnique({
            where: { shop: shop }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: `${shop}@example.com`,
                    shop: shop,
                    name: shop.replace('.myshopify.com', '')
                }
            });
        }

        const defaultFormConfig = {
            "formType": "POPUP",
            "selectedCountry": "MA",
            "websiteContained": false,
            "primaryColor": "#008060",
            "textColor": "rgba(0,0,0,1)",
            "backgroundColor": "rgba(255,255,255,1)",
            "borderColor": "rgba(0,0,0,1)",
            "borderWidth": 1,
            "borderRadius": 8,
            "textSize": 14,
            "shadow": true,
            "stickyButton": true,
            "mobileFullscreen": false,
            "formStyle": "modern",
            "fontFamily": "Inter, sans-serif",
            "buttonColor": "#008060",
            "title": "Complete Your Order",
            "buttonText": "Complete Order",
            "successMessage": "Thank you for your order!",
            "errorMessage": "Something went wrong!",
            "hideCloseButton": false,
            "hideFieldLabels": false,
            "rtlSupport": false,
            "buyButton": {
                "text": "Buy with Cash on Delivery",
                "subtitle": "",
                "animation": "none",
                "icon": "",
                "stickyPosition": "bottom",
                "backgroundColor": "rgba(0,0,0,1)",
                "textColor": "rgba(255,255,255,1)",
                "fontSize": 16,
                "borderRadius": 8,
                "borderWidth": 1,
                "borderColor": "rgba(0,0,0,1)",
                "shadow": true,
                "mobileSticky": false
            },
            "fields": [
                {
                    "id": 15,
                    "label": "TOTALS SUMMARY",
                    "movable": true,
                    "visible": true,
                    "type": "section",
                    "totalSettings": {
                        "subtotalTitle": "Subtotal",
                        "subtotalValue": "19.99 dh",
                        "shippingTitle": "Shipping",
                        "shippingValue": "Free",
                        "totalTitle": "Total",
                        "totalValue": "19.99 dh",
                        "showTaxesMessage": false,
                        "backgroundColor": "rgba(235,235,235,1)"
                    }
                },
                {
                    "id": 2,
                    "label": "SHIPPING RATES",
                    "movable": true,
                    "visible": true,
                    "type": "section",
                    "shippingSettings": {
                        "title": "Shipping method",
                        "freeText": "Free",
                        "fontSize": 16
                    }
                },
                {
                    "id": 4,
                    "label": "DISCOUNT CODES",
                    "movable": true,
                    "visible": false,
                    "type": "section",
                    "discountSettings": {
                        "limitOnePerOrder": true,
                        "discountsLineText": "Discounts",
                        "fieldLabel": "Discount code",
                        "applyButtonText": "Apply",
                        "buttonBackgroundColor": "rgba(0,0,0,1)",
                        "invalidCodeError": "Enter a valid discount code.",
                        "limitError": "Only 1 discount per order is allowed."
                    }
                },
                {
                    "id": 3,
                    "label": "UPSELL AREAS",
                    "movable": true,
                    "visible": false,
                    "type": "section"
                },
                {
                    "id": 5,
                    "label": "Enter your shipping address",
                    "movable": false,
                    "visible": true,
                    "type": "section",
                    "sectionSettings": {
                        "customText": "Enter your shipping address",
                        "alignment": "center",
                        "fontSize": 16,
                        "fontWeight": "bold",
                        "textColor": "#000000"
                    }
                },
                {
                    "id": 6,
                    "label": "First name",
                    "movable": true,
                    "visible": true,
                    "type": "input",
                    "required": true,
                    "displayLabel": "First name",
                    "placeholder": "First name",
                    "showIcon": false,
                    "minLength": 2,
                    "maxLength": 250,
                    "errorText": "Please enter a valid first name"
                },
                {
                    "id": 7,
                    "label": "Last name",
                    "movable": true,
                    "visible": false,
                    "type": "input",
                    "required": true,
                    "displayLabel": "Last name",
                    "placeholder": "Last name",
                    "showIcon": false,
                    "minLength": 2,
                    "maxLength": 250,
                    "errorText": "Please enter a valid last name"
                },
                {
                    "id": 8,
                    "label": "Phone number",
                    "movable": true,
                    "visible": true,
                    "type": "input",
                    "required": true,
                    "displayLabel": "Phone number",
                    "placeholder": "Phone number",
                    "showIcon": false,
                    "minLength": 10,
                    "maxLength": 15,
                    "errorText": "Please enter a valid phone number"
                },
                {
                    "id": 9,
                    "label": "Address",
                    "movable": true,
                    "visible": true,
                    "type": "input",
                    "required": true,
                    "displayLabel": "Address",
                    "placeholder": "Address",
                    "showIcon": false,
                    "minLength": 5,
                    "maxLength": 250,
                    "errorText": "Please enter a valid address"
                },
                {
                    "id": 10,
                    "label": "Address 2",
                    "movable": true,
                    "visible": false,
                    "type": "input",
                    "required": false,
                    "displayLabel": "Address 2",
                    "placeholder": "Address 2 (optional)",
                    "showIcon": false,
                    "minLength": 0,
                    "maxLength": 250,
                    "errorText": ""
                },
                {
                    "id": 11,
                    "label": "Province",
                    "movable": true,
                    "visible": false,
                    "type": "input",
                    "required": true,
                    "displayLabel": "Province",
                    "placeholder": "Province",
                    "showIcon": false,
                    "minLength": 2,
                    "maxLength": 50,
                    "errorText": "Please enter a valid province"
                },
                {
                    "id": 12,
                    "label": "City",
                    "movable": true,
                    "visible": true,
                    "type": "input",
                    "required": true,
                    "displayLabel": "City",
                    "placeholder": "City",
                    "showIcon": false,
                    "minLength": 2,
                    "maxLength": 50,
                    "errorText": "Please enter a valid city"
                },
                {
                    "id": 13,
                    "label": "Zip code",
                    "movable": true,
                    "visible": false,
                    "type": "input",
                    "required": true,
                    "displayLabel": "Zip code",
                    "placeholder": "Zip code",
                    "showIcon": false,
                    "minLength": 3,
                    "maxLength": 10,
                    "errorText": "Please enter a valid zip code"
                },
                {
                    "id": 14,
                    "label": "Email",
                    "movable": true,
                    "visible": false,
                    "type": "input",
                    "required": true,
                    "displayLabel": "Email",
                    "placeholder": "Email address",
                    "showIcon": false,
                    "minLength": 5,
                    "maxLength": 100,
                    "errorText": "Please enter a valid email address"
                },
                {
                    "id": 16,
                    "label": "SUBMIT BUTTON",
                    "movable": true,
                    "visible": true,
                    "type": "button",
                    "buttonSettings": {
                        "buttonText": "COMPLETE ORDER - {order_total}",
                        "buttonSubtitle": "",
                        "buttonAnimation": "none",
                        "buttonIcon": "",
                        "backgroundColor": "rgba(0,0,0,1)",
                        "textColor": "rgba(255,255,255,1)",
                        "fontSize": 16,
                        "borderRadius": 8,
                        "borderWidth": 1,
                        "borderColor": "rgba(0,0,0,1)",
                        "shadow": true
                    }
                }
            ],
            "general": {
                "orderOptions": {
                    "createCODOrders": true,
                    "saveAsDraft": false,
                    "saveUTM": false
                },
                "formOptions": {
                    "disableDiscounts": false,
                    "disableAutofill": false,
                    "removeLeadingZero": false,
                    "addTag": true
                },
                "redirectOptions": {
                    "redirectType": "message",
                    "customURL": `https://${shop}/`,
                    "whatsAppNumber": "",
                    "whatsAppMessage": "",
                    "thankYouMessage": "Thank you for your purchase! 🎉\nWe will contact you soon to confirm your order. ✅"
                }
            }
        };

        const form = await prisma.form.create({
            data: {
                userId: user.id,
                shop: shop,
                name: "Default Form",
                formType: "POPUP",
                status: "ACTIVE",
                configs: {
                    create: {
                        userId: user.id,
                        shop: shop,
                        formType: "POPUP",
                        status: "ACTIVE",
                        config: defaultFormConfig,
                        isActive: true
                    }
                }
            }
        });

        return ({ success: true, reload: true });


    } catch (error) {
        console.error("Error creating form:", error);
        throw new Response("Error installing form", { status: 500 });
    }
};