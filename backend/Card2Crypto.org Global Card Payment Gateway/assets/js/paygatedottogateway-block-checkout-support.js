( function( blocks, i18n, element, components, editor ) {
    const { registerPaymentMethod } = wc.wcBlocksRegistry;
    // Use the localized data from PHP
    const card2cryptogateways = card2cryptogatewayData || [];
    card2cryptogateways.forEach( ( card2cryptogateway ) => {
        registerPaymentMethod({
            name: card2cryptogateway.id,
            label: card2cryptogateway.label,
            ariaLabel: card2cryptogateway.label,
            content: element.createElement(
                'div',
                { className: 'card2cryptogateway-method-wrapper' },
                element.createElement( 
                    'div', 
                    { className: 'card2cryptogateway-method-label' },
                    '' + card2cryptogateway.description 
                ),
                card2cryptogateway.icon_url ? element.createElement(
                    'img', 
                    { 
                        src: card2cryptogateway.icon_url,
                        alt: card2cryptogateway.label,
                        className: 'card2cryptogateway-method-icon'
                    }
                ) : null
            ),
            edit: element.createElement(
                'div',
                { className: 'card2cryptogateway-method-wrapper' },
                element.createElement( 
                    'div', 
                    { className: 'card2cryptogateway-method-label' },
                    '' + card2cryptogateway.description 
                ),
                card2cryptogateway.icon_url ? element.createElement(
                    'img', 
                    { 
                        src: card2cryptogateway.icon_url,
                        alt: card2cryptogateway.label,
                        className: 'card2cryptogateway-method-icon'
                    }
                ) : null
            ),
            canMakePayment: () => true,
        });
    });
} )(
    window.wp.blocks,
    window.wp.i18n,
    window.wp.element,
    window.wp.components,
    window.wp.blockEditor
);