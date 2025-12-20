import React from 'react';
import { CARD_VARIANTS } from '../../styles/designSystem';

/**
 * Reusable Card Component
 * Consumes CARD_VARIANTS from designSystem.js
 * 
 * @param {string} variant - Key from CARD_VARIANTS (MACRO, MICRO, GHOST, etc.)
 * @param {function} onClick - Optional click handler (enables interactive styles)
 * @param {string} className - Optional overrides (use sparingly)
 * @param {React.ReactNode} children - Card content
 */
const Card = ({
    variant = 'MACRO',
    onClick,
    children,
    className = '',
    ...props
}) => {
    const styles = CARD_VARIANTS[variant] || CARD_VARIANTS.MACRO;

    // Combine container styles + interactive styles (if clickable)
    const baseClasses = styles.container;
    const interactionClasses = onClick ? styles.interactive : '';

    return (
        <div
            onClick={onClick}
            className={`${baseClasses} ${interactionClasses} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
