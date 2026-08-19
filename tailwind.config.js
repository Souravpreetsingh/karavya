module.exports = {
  content: ["./*.html", "./karavya.js"],
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
  "theme": {
    "extend": {
      "colors": {
        "rose-white": "#FFF5F7",
        "deep-rose": "#8F4A5B",
        "rose-gold": "#B76E79",
        "secondary-fixed-dim": "#f6b7b7",
        "tertiary-fixed": "#ffd9df",
        "primary-fixed-dim": "#f0b8c6",
        "on-secondary": "#ffffff",
        "tertiary-container": "#ffb0c1",
        "on-tertiary-fixed": "#3b0618",
        "surface-variant": "#f8dbe1",
        "on-primary-container": "#704652",
        "outline-variant": "#d4c2c5",
        "secondary-container": "#ffbfbf",
        "on-surface-variant": "#504446",
        "surface-container-lowest": "#ffffff",
        "surface-bright": "#fff8f8",
        "on-tertiary-container": "#7f3d4e",
        "on-tertiary-fixed-variant": "#713243",
        "primary": "#7e525e",
        "on-primary-fixed": "#31111c",
        "tertiary-fixed-dim": "#ffb1c1",
        "on-tertiary": "#ffffff",
        "background": "#fff8f8",
        "on-secondary-container": "#7b4b4b",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "on-error": "#ffffff",
        "on-background": "#27171b",
        "surface-container": "#ffe8ec",
        "surface-container-low": "#fff0f2",
        "on-primary": "#ffffff",
        "on-primary-fixed-variant": "#633b47",
        "outline": "#827376",
        "surface": "#fff8f8",
        "surface-dim": "#efd3d8",
        "surface-tint": "#7e525e",
        "inverse-primary": "#f0b8c6",
        "primary-container": "#efb7c5",
        "on-surface": "#27171b",
        "inverse-surface": "#3d2c30",
        "on-secondary-fixed-variant": "#673a3b",
        "inverse-on-surface": "#ffecef",
        "on-secondary-fixed": "#331012",
        "secondary": "#825152",
        "surface-container-high": "#fee1e6",
        "tertiary": "#8e495a",
        "secondary-fixed": "#ffdad9",
        "error": "#ba1a1a",
        "primary-fixed": "#ffd9e1",
        "surface-container-highest": "#f8dbe1",
        "dark-espresso": "#2B1B1F",
        "blush-rose": "#F8DCE3",
        "pearl-rose": "#FCECEF",
        "soft-rose": "#EFB7C5",
        "text-muted": "#6B5D55",
        "warm-champagne": "#e0c0b0",
        "metallic-rose-gold": "#b76e79",
        "gold": "#B08D57",
        "gold-light": "#DCC8A3",
        "text-primary": "#9C4A6E",
        "text-secondary": "#7A5C6B",
        "bg-cream": "#FAF4F0",
        "text-brown": "#3D2B2B",
        "text-rose": "#A13564",
        "text-mauve": "#5B4154",
        "text-taupe": "#8C7268",
        "rose-quartz": "#D9A5B3",
        "rosewood": "#8C4A5E",
        "gift-rose": "#C98A7D",
        "gift-gold": "#B8860B",
        "pearl-cream": "#F6EFE6",
        "soft-blush": "#F8E8E4",
        "deep-plum": "#4A2C3A",
        "rose-gold-bright": "#C895A2",
        "rose-gold-depth": "#8F4A5B",
        "champagne": "#E8D8D0"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem",
        "4xl": "2rem",
        "5xl": "2.5rem"
      },
      "spacing": {
        "margin-desktop": "64px",
        "gutter": "24px",
        "unit": "8px",
        "margin-mobile": "20px",
        "container-max": "1280px",
        "section-gap-md": "80px",
        "base": "8px",
        "section-gap-lg": "120px"
      },
      "fontFamily": {
        "label-sm": [
          "DM Sans"
        ],
        "display-lg-mobile": [
          "Playfair Display"
        ],
        "display-lg": [
          "Playfair Display"
        ],
        "body-md": [
          "DM Sans"
        ],
        "headline-lg": [
          "Playfair Display"
        ],
        "body-lg": [
          "DM Sans"
        ],
        "headline-md": [
          "Playfair Display"
        ],
        "headline-lg-mobile": [
          "Playfair Display"
        ],
        "label-lg": [
          "DM Sans"
        ],
        "display": [
          "\"Playfair Display\"",
          "serif"
        ],
        "body": [
          "\"DM Sans\"",
          "sans-serif"
        ],
        "serif": [
          "\"Playfair Display\"",
          "serif"
        ],
        "sans": [
          "\"DM Sans\"",
          "sans-serif"
        ]
      },
      "fontSize": {
        "label-sm": [
          "12px",
          {
            "lineHeight": "1",
            "letterSpacing": "0.1em",
            "fontWeight": "500"
          }
        ],
        "display-lg-mobile": [
          "40px",
          {
            "lineHeight": "1.2",
            "fontWeight": "700"
          }
        ],
        "display-lg": [
          "64px",
          {
            "lineHeight": "1.1",
            "letterSpacing": "-0.02em",
            "fontWeight": "700"
          }
        ],
        "body-md": [
          "16px",
          {
            "lineHeight": "1.6",
            "fontWeight": "400"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "1.3",
            "fontWeight": "600"
          }
        ],
        "body-lg": [
          "18px",
          {
            "lineHeight": "1.6",
            "fontWeight": "400"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "1.4",
            "fontWeight": "600"
          }
        ],
        "headline-lg-mobile": [
          "32px",
          {
            "lineHeight": "1.2",
            "fontWeight": "600"
          }
        ],
        "label-lg": [
          "14px",
          {
            "lineHeight": "1.2",
            "letterSpacing": "0.15em",
            "fontWeight": "600"
          }
        ]
      }
    }
  },
  "darkMode": "class"
};
