import React, { useEffect } from 'react';

/**
 * ScrollbarStyles Component
 * Injects global custom scrollbar styles into the document
 * This ensures all scrollbars throughout the app are styled consistently
 */
const ScrollbarStyles: React.FC = () => {
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.id = 'forge-custom-scrollbars';
    style.textContent = `
      /* Global scrollbar styles - applies to ALL elements */
      * {
        scrollbar-width: thin !important;
        scrollbar-color: #3f3f46 transparent !important;
      }
      
      /* WebKit browsers */
      *::-webkit-scrollbar {
        width: 6px !important;
        height: 6px !important;
      }
      
      *::-webkit-scrollbar-track {
        background: transparent !important;
      }
      
      *::-webkit-scrollbar-thumb {
        background: #3f3f46 !important;
        border-radius: 9999px !important;
        border: none !important;
      }
      
      *::-webkit-scrollbar-thumb:hover {
        background: #52525b !important;
      }
      
      *::-webkit-scrollbar-corner {
        background: transparent !important;
      }
      
      /* Specific element selectors */
      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      div::-webkit-scrollbar,
      section::-webkit-scrollbar,
      article::-webkit-scrollbar,
      aside::-webkit-scrollbar,
      nav::-webkit-scrollbar,
      main::-webkit-scrollbar,
      header::-webkit-scrollbar,
      footer::-webkit-scrollbar,
      ul::-webkit-scrollbar,
      ol::-webkit-scrollbar,
      li::-webkit-scrollbar,
      form::-webkit-scrollbar,
      table::-webkit-scrollbar,
      textarea::-webkit-scrollbar,
      iframe::-webkit-scrollbar {
        width: 6px !important;
        height: 6px !important;
      }
      
      /* Tailwind overflow classes */
      .overflow-auto::-webkit-scrollbar,
      .overflow-y-auto::-webkit-scrollbar,
      .overflow-x-auto::-webkit-scrollbar,
      .overflow-scroll::-webkit-scrollbar,
      .overflow-y-scroll::-webkit-scrollbar,
      .overflow-x-scroll::-webkit-scrollbar,
      [class*="overflow-"]::-webkit-scrollbar {
        width: 6px !important;
        height: 6px !important;
      }
      
      .overflow-auto::-webkit-scrollbar-thumb,
      .overflow-y-auto::-webkit-scrollbar-thumb,
      .overflow-x-auto::-webkit-scrollbar-thumb,
      .overflow-scroll::-webkit-scrollbar-thumb,
      .overflow-y-scroll::-webkit-scrollbar-thumb,
      .overflow-x-scroll::-webkit-scrollbar-thumb,
      [class*="overflow-"]::-webkit-scrollbar-thumb {
        background: #3f3f46 !important;
        border-radius: 9999px !important;
      }
      
      .overflow-auto::-webkit-scrollbar-thumb:hover,
      .overflow-y-auto::-webkit-scrollbar-thumb:hover,
      .overflow-x-auto::-webkit-scrollbar-thumb:hover,
      .overflow-scroll::-webkit-scrollbar-thumb:hover,
      .overflow-y-scroll::-webkit-scrollbar-thumb:hover,
      .overflow-x-scroll::-webkit-scrollbar-thumb:hover,
      [class*="overflow-"]::-webkit-scrollbar-thumb:hover {
        background: #52525b !important;
      }
      
      /* Firefox */
      html, body, div, section, article, aside, nav, main, header, footer,
      ul, ol, li, form, table, textarea, iframe {
        scrollbar-width: thin !important;
        scrollbar-color: #3f3f46 transparent !important;
      }
    `;
    
    // Only add if not already present
    if (!document.getElementById('forge-custom-scrollbars')) {
      document.head.appendChild(style);
    }
    
    // Cleanup
    return () => {
      // Don't remove on unmount - we want these styles to persist
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ScrollbarStyles;
