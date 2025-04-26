<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('plugins_loaded', 'init_card2cryptogateway_robinhoodcom_gateway');

function init_card2cryptogateway_robinhoodcom_gateway() {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }

class PayGateDotTo_Instant_Payment_Gateway_Robinhood extends WC_Payment_Gateway {

    public function __construct() {
        $this->id                 = 'card2crypto-instant-payment-gateway-robinhood';
        $this->icon = sanitize_url($this->get_option('icon_url'));
        $this->method_title       = esc_html__('Card2Crypto.org Global Payment Gateway (robinhood.com)', 'instant-approval-payment-gateway'); // Escaping title
        $this->method_description = esc_html__('Accept domestic and international credit/debit cards, Apple Pay, Google Pay, SEPA, and local bank transfers directly to your USDC Polygon (Matic) wallet instantly with chargeback protection without any KYC. Revolutionary web3.0 technology powered by robinhood.com infrastructure', 'instant-approval-payment-gateway'); // Escaping description
        $this->has_fields         = false;

        $this->init_form_fields();
        $this->init_settings();

        $this->title       = sanitize_text_field($this->get_option('title'));
        $this->description = sanitize_text_field($this->get_option('description'));

        // Use the configured settings for redirect and icon URLs
        $this->robinhoodcom_wallet_address = sanitize_text_field($this->get_option('robinhoodcom_wallet_address'));
        $this->icon_url     = sanitize_url($this->get_option('icon_url'));

        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
    }

    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title'   => esc_html__('Enable/Disable', 'instant-approval-payment-gateway'), // Escaping title
                'type'    => 'checkbox',
                'label'   => esc_html__('Enable robinhood.com payment gateway', 'instant-approval-payment-gateway'), // Escaping label
                'default' => 'no',
            ),
            'title' => array(
                'title'       => esc_html__('Title', 'instant-approval-payment-gateway'), // Escaping title
                'type'        => 'text',
                'description' => esc_html__('Payment method title that users will see during checkout.', 'instant-approval-payment-gateway'), // Escaping description
                'default'     => esc_html__('Global Credit/Debit Card', 'instant-approval-payment-gateway'), // Escaping default value
                'desc_tip'    => true,
            ),
            'description' => array(
                'title'       => esc_html__('Description', 'instant-approval-payment-gateway'), // Escaping title
                'type'        => 'textarea',
                'description' => esc_html__('Payment method description that users will see during checkout.', 'instant-approval-payment-gateway'), // Escaping description
                'default'     => esc_html__('Pay securely using your credit or debit card', 'instant-approval-payment-gateway'), // Escaping default value
                'desc_tip'    => true,
            ),
            'robinhoodcom_wallet_address' => array(
                'title'       => esc_html__('Wallet Address', 'instant-approval-payment-gateway'), // Escaping title
                'type'        => 'text',
                'description' => esc_html__('Insert your USDC (Polygon) wallet address to receive instant payouts.', 'instant-approval-payment-gateway'), // Escaping description
                'desc_tip'    => true,
            ),
            'icon_url' => array(
                'title'       => esc_html__('Icon URL', 'instant-approval-payment-gateway'), // Escaping title
                'type'        => 'url',
                'description' => esc_html__('Enter the URL of the icon image for the payment method.', 'instant-approval-payment-gateway'), // Escaping description
                'desc_tip'    => true,
            ),
        );
    }
	 // Add this method to validate the wallet address in wp-admin
    public function process_admin_options() {
		if (!isset($_POST['_wpnonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'])), 'woocommerce-settings')) {
    WC_Admin_Settings::add_error(__('Nonce verification failed. Please try again.', 'instant-approval-payment-gateway'));
    return false;
}
        $robinhoodcom_admin_wallet_address = isset($_POST[$this->plugin_id . $this->id . '_robinhoodcom_wallet_address']) ? sanitize_text_field( wp_unslash( $_POST[$this->plugin_id . $this->id . '_robinhoodcom_wallet_address'])) : '';

        // Check if wallet address starts with "0x"
        if (substr($robinhoodcom_admin_wallet_address, 0, 2) !== '0x') {
            WC_Admin_Settings::add_error(__('Invalid Wallet Address: Please insert your USDC Polygon wallet address.', 'instant-approval-payment-gateway'));
            return false;
        }

        // Check if wallet address matches the USDC contract address
        if (strtolower($robinhoodcom_admin_wallet_address) === '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359') {
            WC_Admin_Settings::add_error(__('Invalid Wallet Address: Please insert your USDC Polygon wallet address.', 'instant-approval-payment-gateway'));
            return false;
        }

        // Proceed with the default processing if validations pass
        return parent::process_admin_options();
    }
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        $card2cryptogateway_robinhoodcom_currency = get_woocommerce_currency();
		$card2cryptogateway_robinhoodcom_total = $order->get_total();
		$card2cryptogateway_robinhoodcom_nonce = wp_create_nonce( 'card2cryptogateway_robinhoodcom_nonce_' . $order_id );
		$card2cryptogateway_robinhoodcom_callback = add_query_arg(array('order_id' => $order_id, 'nonce' => $card2cryptogateway_robinhoodcom_nonce,), rest_url('card2cryptogateway/v1/card2cryptogateway-robinhoodcom/'));
		$card2cryptogateway_robinhoodcom_email = urlencode(sanitize_email($order->get_billing_email()));
		
		if ($card2cryptogateway_robinhoodcom_currency === 'USD') {
        $card2cryptogateway_robinhoodcom_final_total = $card2cryptogateway_robinhoodcom_total;
		$card2cryptogateway_robinhoodcom_reference_total = (float)$card2cryptogateway_robinhoodcom_final_total;
		} else {
		
$card2cryptogateway_robinhoodcom_response = wp_remote_get('https://api.card2crypto.org/control/convert.php?value=' . $card2cryptogateway_robinhoodcom_total . '&from=' . strtolower($card2cryptogateway_robinhoodcom_currency), array('timeout' => 30));

if (is_wp_error($card2cryptogateway_robinhoodcom_response)) {
    // Handle error
    wc_add_notice(__('Payment error:', 'instant-approval-payment-gateway') . __('Payment could not be processed due to failed currency conversion process, please try again', 'instant-approval-payment-gateway'), 'error');
    return null;
} else {

$card2cryptogateway_robinhoodcom_body = wp_remote_retrieve_body($card2cryptogateway_robinhoodcom_response);
$card2cryptogateway_robinhoodcom_conversion_resp = json_decode($card2cryptogateway_robinhoodcom_body, true);

if ($card2cryptogateway_robinhoodcom_conversion_resp && isset($card2cryptogateway_robinhoodcom_conversion_resp['value_coin'])) {
    // Escape output
    $card2cryptogateway_robinhoodcom_final_total	= sanitize_text_field($card2cryptogateway_robinhoodcom_conversion_resp['value_coin']);
    $card2cryptogateway_robinhoodcom_reference_total = (float)$card2cryptogateway_robinhoodcom_final_total;	
} else {
    wc_add_notice(__('Payment error:', 'instant-approval-payment-gateway') . __('Payment could not be processed, please try again (unsupported store currency)', 'instant-approval-payment-gateway'), 'error');
    return null;
}	
		}
		}
$card2cryptogateway_robinhoodcom_gen_wallet = wp_remote_get('https://api.card2crypto.org/control/wallet.php?address=' . $this->robinhoodcom_wallet_address .'&callback=' . urlencode($card2cryptogateway_robinhoodcom_callback), array('timeout' => 30));

if (is_wp_error($card2cryptogateway_robinhoodcom_gen_wallet)) {
    // Handle error
    wc_add_notice(__('Wallet error:', 'instant-approval-payment-gateway') . __('Payment could not be processed due to incorrect payout wallet settings, please contact website admin', 'instant-approval-payment-gateway'), 'error');
    return null;
} else {
	$card2cryptogateway_robinhoodcom_wallet_body = wp_remote_retrieve_body($card2cryptogateway_robinhoodcom_gen_wallet);
	$card2cryptogateway_robinhoodcom_wallet_decbody = json_decode($card2cryptogateway_robinhoodcom_wallet_body, true);

 // Check if decoding was successful
    if ($card2cryptogateway_robinhoodcom_wallet_decbody && isset($card2cryptogateway_robinhoodcom_wallet_decbody['address_in'])) {
        // Store the address_in as a variable
        $card2cryptogateway_robinhoodcom_gen_addressIn = wp_kses_post($card2cryptogateway_robinhoodcom_wallet_decbody['address_in']);
        $card2cryptogateway_robinhoodcom_gen_polygon_addressIn = sanitize_text_field($card2cryptogateway_robinhoodcom_wallet_decbody['polygon_address_in']);
		$card2cryptogateway_robinhoodcom_gen_callback = sanitize_url($card2cryptogateway_robinhoodcom_wallet_decbody['callback_url']);
		// Save $robinhoodcomresponse in order meta data
    $order->add_meta_data('card2crypto_robinhoodcom_tracking_address', $card2cryptogateway_robinhoodcom_gen_addressIn, true);
    $order->add_meta_data('card2crypto_robinhoodcom_polygon_temporary_order_wallet_address', $card2cryptogateway_robinhoodcom_gen_polygon_addressIn, true);
    $order->add_meta_data('card2crypto_robinhoodcom_callback', $card2cryptogateway_robinhoodcom_gen_callback, true);
	$order->add_meta_data('card2crypto_robinhoodcom_converted_amount', $card2cryptogateway_robinhoodcom_final_total, true);
	$order->add_meta_data('card2crypto_robinhoodcom_expected_amount', $card2cryptogateway_robinhoodcom_reference_total, true);
	$order->add_meta_data('card2crypto_robinhoodcom_nonce', $card2cryptogateway_robinhoodcom_nonce, true);
    $order->save();
    } else {
        wc_add_notice(__('Payment error:', 'instant-approval-payment-gateway') . __('Payment could not be processed, please try again (wallet address error)', 'instant-approval-payment-gateway'), 'error');

        return null;
    }
}

// Check if the Checkout page is using Checkout Blocks
if (card2cryptogateway_is_checkout_block()) {
    global $woocommerce;
	$woocommerce->cart->empty_cart();
}

        // Redirect to payment page
        return array(
            'result'   => 'success',
            'redirect' => 'https://pay.card2crypto.org/process-payment.php?address=' . $card2cryptogateway_robinhoodcom_gen_addressIn . '&amount=' . (float)$card2cryptogateway_robinhoodcom_final_total . '&provider=robinhood&email=' . $card2cryptogateway_robinhoodcom_email . '&currency=' . $card2cryptogateway_robinhoodcom_currency,
        );
    }

}

function card2crypto_add_instant_payment_gateway_robinhoodcom($gateways) {
    $gateways[] = 'PayGateDotTo_Instant_Payment_Gateway_Robinhood';
    return $gateways;
}
add_filter('woocommerce_payment_gateways', 'card2crypto_add_instant_payment_gateway_robinhoodcom');
}

// Add custom endpoint for changing order status
function card2cryptogateway_robinhoodcom_change_order_status_rest_endpoint() {
    // Register custom route
    register_rest_route( 'card2cryptogateway/v1', '/card2cryptogateway-robinhoodcom/', array(
        'methods'  => 'GET',
        'callback' => 'card2cryptogateway_robinhoodcom_change_order_status_callback',
        'permission_callback' => '__return_true',
    ));
}
add_action( 'rest_api_init', 'card2cryptogateway_robinhoodcom_change_order_status_rest_endpoint' );

// Callback function to change order status
function card2cryptogateway_robinhoodcom_change_order_status_callback( $request ) {
    $order_id = absint($request->get_param( 'order_id' ));
	$card2cryptogateway_robinhoodcomgetnonce = sanitize_text_field($request->get_param( 'nonce' ));
	$card2cryptogateway_robinhoodcompaid_txid_out = sanitize_text_field($request->get_param('txid_out'));
	$card2cryptogateway_robinhoodcompaid_value_coin = sanitize_text_field($request->get_param('value_coin'));
	$card2cryptogateway_robinhoodcomfloatpaid_value_coin = (float)$card2cryptogateway_robinhoodcompaid_value_coin;

    // Check if order ID parameter exists
    if ( empty( $order_id ) ) {
        return new WP_Error( 'missing_order_id', __( 'Order ID parameter is missing.', 'instant-approval-payment-gateway' ), array( 'status' => 400 ) );
    }

    // Get order object
    $order = wc_get_order( $order_id );

    // Check if order exists
    if ( ! $order ) {
        return new WP_Error( 'invalid_order', __( 'Invalid order ID.', 'instant-approval-payment-gateway' ), array( 'status' => 404 ) );
    }
	
	// Verify nonce
    if ( empty( $card2cryptogateway_robinhoodcomgetnonce ) || $order->get_meta('card2crypto_robinhoodcom_nonce', true) !== $card2cryptogateway_robinhoodcomgetnonce ) {
        return new WP_Error( 'invalid_nonce', __( 'Invalid nonce.', 'instant-approval-payment-gateway' ), array( 'status' => 403 ) );
    }

    // Check if the order is pending and payment method is 'card2crypto-instant-payment-gateway-robinhood'
    if ( $order && $order->get_status() !== 'processing' && $order->get_status() !== 'completed' && 'card2crypto-instant-payment-gateway-robinhood' === $order->get_payment_method() ) {
	$card2cryptogateway_robinhoodcomexpected_amount = (float)$order->get_meta('card2crypto_robinhoodcom_expected_amount', true);
	$card2cryptogateway_robinhoodcomthreshold = 0.60 * $card2cryptogateway_robinhoodcomexpected_amount;
		if ( $card2cryptogateway_robinhoodcomfloatpaid_value_coin < $card2cryptogateway_robinhoodcomthreshold ) {
			// Mark the order as failed and add an order note
            $order->update_status('failed', __( 'Payment received is less than 60% of the order total. Customer may have changed the payment values on the checkout page.', 'instant-approval-payment-gateway' ));
            /* translators: 1: Transaction ID */
            $order->add_order_note(sprintf( __( 'Order marked as failed: Payment received is less than 60%% of the order total. Customer may have changed the payment values on the checkout page. TXID: %1$s', 'instant-approval-payment-gateway' ), $card2cryptogateway_robinhoodcompaid_txid_out));
            return array( 'message' => 'Order status changed to failed due to partial payment.' );
			
		} else {
        // Change order status to processing
		$order->payment_complete();
        $order->update_status( 'processing' );
		/* translators: 1: Transaction ID */
		$order->add_order_note( sprintf(__('Payment completed by the provider TXID: %1$s', 'instant-approval-payment-gateway'), $card2cryptogateway_robinhoodcompaid_txid_out) );
        // Return success response
        return array( 'message' => 'Order status changed to processing.' );
		}
    } else {
        // Return error response if conditions are not met
        return new WP_Error( 'order_not_eligible', __( 'Order is not eligible for status change.', 'instant-approval-payment-gateway' ), array( 'status' => 400 ) );
    }
}
?>