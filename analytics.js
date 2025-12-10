/**
 * Vercel Web Analytics
 * 
 * This script initializes Vercel Web Analytics for the Agent Builder Wizard.
 * It must run on the client side to track user interactions and page performance.
 * 
 * Note: The inject() function provides web vital metrics and page analytics
 * without route support. It works with plain HTML and any frontend framework.
 */

(function() {
    // Only initialize analytics in production environments
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
        console.log('[Analytics] Development mode detected - analytics disabled');
        return;
    }

    // Dynamically import and inject analytics
    import('@vercel/analytics').then(module => {
        try {
            module.inject();
            console.log('[Analytics] Vercel Web Analytics initialized');
        } catch (error) {
            console.warn('[Analytics] Failed to initialize Vercel Web Analytics:', error);
        }
    }).catch(error => {
        console.warn('[Analytics] Failed to load Vercel Web Analytics module:', error);
    });
})();
