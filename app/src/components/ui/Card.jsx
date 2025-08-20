import React from 'react';

const Card = ({ 
  children, 
  variant = 'default', 
  className = '',
  hover = false,
  ...props 
}) => {
  const baseClasses = 'rounded-2xl border transition-all duration-300';
  
  const variants = {
    default: 'bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700 p-8',
    gradient: 'bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-lg border-gray-200 dark:border-gray-700 p-8',
    glass: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border-white/20 dark:border-gray-700/20 p-6',
    outline: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 p-6',
    elevated: 'bg-white dark:bg-gray-800 shadow-xl border-gray-100 dark:border-gray-700 p-8'
  };
  
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  
  const classes = `${baseClasses} ${variants[variant]} ${hoverClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;