import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component that can be customized with
 * different sizes and colors.
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('sm', 'md', 'lg')
 * @param {string} props.color - Color theme for the spinner
 * @param {string} props.message - Optional loading message
 * @param {boolean} props.fullScreen - Whether to display spinner in center of screen
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  // Color classes
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };
  
  // Container classes based on fullScreen prop
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50' 
    : 'flex flex-col items-center justify-center p-4';
    
  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <svg 
          className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        
        {message && (
          <p className={`mt-2 text-sm ${fullScreen ? 'text-white' : 'text-gray-700'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
