import React from 'react';
import { LucideIcon } from 'lucide-react';
import { CUSTOM_ICON_PATHS } from '../config/customIcons';

interface ThemedIconProps {
  iconKey: keyof typeof CUSTOM_ICON_PATHS;
  Fallback: LucideIcon;
  size?: number | string;
  className?: string;
  [key: string]: any; // for other props like onClick
}

export const ThemedIcon: React.FC<ThemedIconProps> = ({ iconKey, Fallback, size = 24, className, ...props }) => {
  const customSrc = CUSTOM_ICON_PATHS[iconKey];

  if (customSrc) {
    // If size is a number, treat as px. If string, pass through (though style expects strings usually for units other than px)
    // However, for img tag, width/height attributes are usually unitless pixels or we use style.
    // We will use inline style for width/height to override/coexist with Tailwind classes if necessary.
    const style: React.CSSProperties = {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        objectFit: 'contain',
        display: 'inline-block'
    };

    return <img src={customSrc} alt={iconKey} className={className} style={style} {...props} />;
  }

  return <Fallback size={size} className={className} {...props} />;
};
