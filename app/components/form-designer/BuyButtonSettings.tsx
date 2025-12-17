// في components/form-designer/BuyButtonSettings.js
import { Card, Modal, TextField, Select, Checkbox, Button, ColorPicker, RangeSlider } from "@shopify/polaris";
import { useState, useRef } from "react";

interface BuyButtonSettingsProps {
  formConfig: any;
  updatePartialConfig: (config: any) => void;
}

function hsbToRgba({ hue, brightness, saturation, alpha }: any) {
  const chroma = brightness * saturation;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0, g = 0, b = 0;

  if (huePrime >= 0 && huePrime < 1) [r, g, b] = [chroma, x, 0];
  else if (huePrime < 2) [r, g, b] = [x, chroma, 0];
  else if (huePrime < 3) [r, g, b] = [0, chroma, x];
  else if (huePrime < 4) [r, g, b] = [0, x, chroma];
  else if (huePrime < 5) [r, g, b] = [x, 0, chroma];
  else if (huePrime <= 6) [r, g, b] = [chroma, 0, x];

  const m = brightness - chroma;
  const [R, G, B] = [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  return `rgba(${Math.round(R)}, ${Math.round(G)}, ${Math.round(B)}, ${alpha ?? 1})`;
}

export function BuyButtonSettings({ formConfig, updatePartialConfig }: BuyButtonSettingsProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const buyButton = formConfig.buyButton || {};
  const previewButtonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (previewButtonRef.current) {
      const button = previewButtonRef.current;
      button.style.opacity = '0.9';
      button.style.transform = 'translateY(-1px)';
    }
  };

  const handleMouseLeave = () => {
    if (previewButtonRef.current) {
      const button = previewButtonRef.current;
      button.style.opacity = '1';
      button.style.transform = 'translateY(0)';
    }
  };

  return (
    <>
      <Card>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Buy Button
            </div>
            <div style={{ color: '#6d7175', fontSize: '14px' }}>
              Customize the form Buy Now button
            </div>
          </div>
          <Button
            icon={<span style={{ fontSize: '16px' }}>✏️</span>}
            onClick={() => setPopupOpen(true)}
            variant="tertiary"
          />
        </div>
      </Card>

      <Modal
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        title="Customize Buy Button"
        primaryAction={{
          content: "Save",
          onAction: () => setPopupOpen(false),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setPopupOpen(false),
          },
        ]}
        size="large"
      >
        <Modal.Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Button Text */}
              <TextField
                autoComplete="false"
                label="Button text"
                value={buyButton.text || "Buy with Cash on Delivery"}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    text: value
                  }
                })}
              />

              {/* Button Subtitle */}
              <TextField
                autoComplete="false"
                label="Button subtitle"
                value={buyButton.subtitle || ""}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    subtitle: value
                  }
                })}
              />

              {/* Button Animation */}
              <Select
                label="Button animation"
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Pulse', value: 'pulse' },
                  { label: 'Bounce', value: 'bounce' },
                  { label: 'Shake', value: 'shake' },
                  { label: 'Fade', value: 'fade' }
                ]}
                value={buyButton.animation || 'none'}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    animation: value
                  }
                })}
              />

              {/* Button Icon */}
              <Select
                label="Button icon"
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Shopping Cart', value: 'cart' },
                  { label: 'Bag', value: 'bag' },
                  { label: 'Heart', value: 'heart' },
                  { label: 'Star', value: 'star' },
                  { label: 'Truck', value: 'truck' }
                ]}
                value={buyButton.icon || 'none'}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    icon: value
                  }
                })}
              />

              {/* Sticky Button Position */}
              <Select
                label="Sticky button position"
                options={[
                  { label: 'Bottom', value: 'bottom' },
                  { label: 'Top', value: 'top' },
                  { label: 'Left', value: 'left' },
                  { label: 'Right', value: 'right' }
                ]}
                value={buyButton.stickyPosition || 'bottom'}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    stickyPosition: value
                  }
                })}
              />

              {/* ✅ Background Color */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Background color
                </label>
                <ColorPicker
                  color={
                    typeof buyButton.backgroundColor === 'string'
                      ? { hue: 0, brightness: 1, saturation: 0, alpha: 1 }
                      : buyButton.backgroundColor || { hue: 0, brightness: 1, saturation: 0, alpha: 1 }
                  }
                  onChange={(color) => updatePartialConfig({
                    buyButton: {
                      ...buyButton,
                      backgroundColor: color
                    }
                  })}
                />
              </div>

              {/* ✅ Text Color */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Text color
                </label>
                <ColorPicker
                  color={
                    typeof buyButton.textColor === 'string'
                      ? { hue: 0, brightness: 1, saturation: 0, alpha: 1 }
                      : buyButton.textColor || { hue: 0, brightness: 1, saturation: 0, alpha: 1 }
                  }
                  onChange={(color) => updatePartialConfig({
                    buyButton: {
                      ...buyButton,
                      textColor: color
                    }
                  })}
                />
              </div>

              {/* Font Size */}
              <TextField
                autoComplete="false"
                label="Font size"
                type="number"
                value={buyButton.fontSize || "16"}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    fontSize: value
                  }
                })}
                suffix="px"
              />

              {/* Border Radius */}
              <TextField
                autoComplete="false"
                label="Border radius"
                type="number"
                value={buyButton.borderRadius || "8"}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    borderRadius: value
                  }
                })}
                suffix="px"
              />

              {/* Border Width */}
              <TextField
                autoComplete="false"
                label="Border width"
                type="number"
                value={buyButton.borderWidth || "1"}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    borderWidth: value
                  }
                })}
                suffix="px"
              />

              {/* ✅ Border Color */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Border color
                </label>
                <ColorPicker
                  color={
                    typeof buyButton.borderColor === 'string'
                      ? { hue: 0, brightness: 1, saturation: 0, alpha: 1 }
                      : buyButton.borderColor || { hue: 0, brightness: 1, saturation: 0, alpha: 1 }
                  }
                  onChange={(color) => updatePartialConfig({
                    buyButton: {
                      ...buyButton,
                      borderColor: color
                    }
                  })}
                />
              </div>

              {/* Shadow */}
              <Select
                label="Shadow"
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Small', value: 'small' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Large', value: 'large' }
                ]}
                value={buyButton.shadow || 'none'}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    shadow: value
                  }
                })}
              />

              {/* Mobile Sticky Button */}
              <Checkbox
                label="Enable sticky button on mobile devices (only on product pages)"
                checked={buyButton.mobileSticky || false}
                onChange={(value) => updatePartialConfig({
                  buyButton: {
                    ...buyButton,
                    mobileSticky: value
                  }
                })}
              />
            </div>

            {/* ✅ Preview section */}
            <div>
              <div style={{ marginBottom: '12px', fontWeight: '500' }}>
                Preview
              </div>
              <div style={{
                padding: '20px',
                border: '1px solid #e1e3e5',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
                backgroundColor: '#f6f6f7'
              }}>
                <button
                  ref={previewButtonRef}
                  style={{
                    backgroundColor: hsbToRgba(buyButton.backgroundColor || { hue: 0, brightness: 0, saturation: 0, alpha: 1 }),
                    color: hsbToRgba(buyButton.textColor || { hue: 0, brightness: 1, saturation: 0, alpha: 1 }),
                    border: `${buyButton.borderWidth || '1'}px solid ${hsbToRgba(buyButton.borderColor || { hue: 0, brightness: 0, saturation: 0, alpha: 1 })}`,
                    padding: '12px 24px',
                    borderRadius: `${buyButton.borderRadius || '8'}px`,
                    fontSize: `${buyButton.fontSize || '16'}px`,
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '200px',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: buyButton.shadow === 'small' ? '0 2px 4px rgba(0,0,0,0.1)' :
                      buyButton.shadow === 'medium' ? '0 4px 8px rgba(0,0,0,0.15)' :
                        buyButton.shadow === 'large' ? '0 8px 16px rgba(0,0,0,0.2)' : 'none'
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {buyButton.icon && buyButton.icon !== 'none' && (
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {getIconSvg(buyButton.icon)}
                    </span>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{buyButton.text || "Buy with Cash on Delivery"}</span>
                    {buyButton.subtitle && (
                      <span style={{ fontSize: '12px', opacity: '0.8' }}>
                        {buyButton.subtitle}
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Current settings info */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#6d7175'
              }}>
                <div><strong>Current Settings:</strong></div>
                <div>Text: {buyButton.text || "Buy with Cash on Delivery"}</div>
                <div>Subtitle: {buyButton.subtitle || "None"}</div>
                <div>Animation: {buyButton.animation || 'none'}</div>
                <div>Icon: {buyButton.icon || 'none'}</div>
                <div>Position: {buyButton.stickyPosition || 'bottom'}</div>
                <div>Text Color: {JSON.stringify(buyButton.textColor)}</div>
                <div>BG Color: {JSON.stringify(buyButton.backgroundColor)}</div>
                <div>Font Size: {buyButton.fontSize || '16'}px</div>
                <div>Border Radius: {buyButton.borderRadius || '8'}px</div>
                <div>Border Width: {buyButton.borderWidth || '1'}px</div>
                <div>Border Color: {JSON.stringify(buyButton.borderColor)}</div>
                <div>Shadow: {buyButton.shadow || 'none'}</div>
                <div>Mobile Sticky: {buyButton.mobileSticky ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </>
  );
}


function getIconSvg(icon: string) {
  switch (icon) {
    case 'cart':
      return (
        // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
        //   <path d="M3.25 3a.75.75 0 0 0 0 1.5h1.612a.25.25 0 0 1 .248.22l1.04 8.737a1.75 1.75 0 0 0 1.738 1.543h6.362a.75.75 0 0 0 0-1.5h-6.362a.25.25 0 0 1-.248-.22l-.093-.78h6.35a2.75 2.75 0 0 0 2.743-2.54l.358-4.652a.75.75 0 0 0-.748-.808h-9.656a1.75 1.75 0 0 0-1.732-1.5h-1.612Z" />
        //   <path d="M9 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        //   <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        // </svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path d="M6.25 11.25a.75.75 0 0 0 0 1.5h2.75a.75.75 0 0 0 0-1.5h-2.75Z" />
          <path fillRule="evenodd" d="M2.5 7.25a2.75 2.75 0 0 1 2.75-2.75h9.5a2.75 2.75 0 0 1 2.75 2.75v5.5a2.75 2.75 0 0 1-2.75 2.75h-9.5a2.75 2.75 0 0 1-2.75-2.75v-5.5Zm12.25-1.25c.69 0 1.25.56 1.25 1.25h-12c0-.69.56-1.25 1.25-1.25h9.5Zm1.25 3.25h-12v3.5c0 .69.56 1.25 1.25 1.25h9.5c.69 0 1.25-.56 1.25-1.25v-3.5Z" />
        </svg>
      );
    case 'star':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path d="M11.128 4.123c-.453-.95-1.803-.95-2.256 0l-1.39 2.912-3.199.421c-1.042.138-1.46 1.422-.697 2.146l2.34 2.222-.587 3.172c-.192 1.034.901 1.828 1.825 1.327l2.836-1.54 2.836 1.54c.924.501 2.017-.293 1.825-1.327l-.587-3.172 2.34-2.222c.762-.724.345-2.008-.697-2.146l-3.2-.421-1.389-2.912Z" />
        </svg>
      );
    case 'truck':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path fillRule="evenodd" d="M4 5.25a.75.75 0 0 1 .75-.75h6.991a2.75 2.75 0 0 1 2.645 1.995l.427 1.494a.25.25 0 0 0 .18.173l1.681.421a1.75 1.75 0 0 1 1.326 1.698v1.219a1.75 1.75 0 0 1-1.032 1.597 2.5 2.5 0 1 1-4.955.153h-3.025a2.5 2.5 0 1 1-4.78-.75h-.458a.75.75 0 0 1 0-1.5h2.5c.03 0 .06.002.088.005a2.493 2.493 0 0 1 1.947.745h4.43a2.493 2.493 0 0 1 1.785-.75c.698 0 1.33.286 1.783.748a.25.25 0 0 0 .217-.248v-1.22a.25.25 0 0 0-.19-.242l-1.682-.42a1.75 1.75 0 0 1-1.258-1.217l-.427-1.494a1.25 1.25 0 0 0-1.202-.907h-6.991a.75.75 0 0 1-.75-.75Zm2.5 9.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          <path d="M3.25 8a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z" />
        </svg>
      );
    case 'bag':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path fillRule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z" />
          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        </svg>
      );
    case 'heart':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.469 5.785c-.966-1.047-2.505-1.047-3.47 0-.998 1.081-.998 2.857 0 3.939l5.001 5.42 5.002-5.42c.997-1.082.997-2.858 0-3.939-.966-1.047-2.505-1.047-3.47 0l-.98 1.062a.75.75 0 0 1-1.103 0l-.98-1.062Zm-4.573-1.017c1.56-1.69 4.115-1.69 5.675 0l.429.464.429-.464c1.56-1.69 4.115-1.69 5.675 0 1.528 1.656 1.528 4.317 0 5.973l-5.185 5.62a1.25 1.25 0 0 1-1.838 0l-5.185-5.62c-1.528-1.656-1.528-4.317 0-5.973Z" />
        </svg>
      );
    default:
      return null;
  }
}
