const uiTheme = {
  borderRadius: {
    lg: "var(--radius-lg)",
    md: "var(--radius-md)",
    sm: "var(--radius-sm)",
    DEFAULT: "var(--radius)",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  boxShadow: {
    subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    large: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  colors: {
    brand: {
      teal: "rgb(0, 89, 96)",
      yellow: "rgb(255, 199, 59)",
    },
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    surface: {
      DEFAULT: "hsl(var(--surface))",
      foreground: "hsl(var(--surface-foreground))",
    },
    card: {
      DEFAULT: "hsl(var(--surface))",
      foreground: "hsl(var(--surface-foreground))",
    },
    popover: {
      DEFAULT: "hsl(var(--surface))",
      foreground: "hsl(var(--surface-foreground))",
    },
    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))",
    },
    secondary: {
      DEFAULT: "hsl(var(--secondary))",
      foreground: "hsl(var(--secondary-foreground))",
    },
    muted: {
      DEFAULT: "hsl(var(--muted))",
      foreground: "hsl(var(--muted-foreground))",
    },
    accent: {
      DEFAULT: "hsl(var(--accent))",
      foreground: "hsl(var(--accent-foreground))",
    },
    destructive: {
      DEFAULT: "hsl(var(--danger))",
      foreground: "hsl(var(--danger-foreground))",
    },
    danger: {
      DEFAULT: "hsl(var(--danger))",
      foreground: "hsl(var(--danger-foreground))",
    },
    success: {
      DEFAULT: "hsl(var(--success))",
      foreground: "hsl(var(--success-foreground))",
    },
    warning: {
      DEFAULT: "hsl(var(--warning))",
      foreground: "hsl(var(--warning-foreground))",
    },
    info: {
      DEFAULT: "hsl(var(--info))",
      foreground: "hsl(var(--info-foreground))",
    },
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
  },
}

module.exports = {
  darkMode: ["class"],
  theme: {
    extend: uiTheme,
  },
  plugins: [],
  uiTheme,
}
