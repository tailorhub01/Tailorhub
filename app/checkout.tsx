import { Platform } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Phone, MapPin, CreditCard, Banknote } from 'lucide-react-native';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    description: string;
  }[];
}

interface UserAddress {
  id: string;
  title: string;
  full_address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export default function CheckoutScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
    paymentMethod: 'cod', // Default to Cash on Delivery
  });

  useEffect(() => {
    if (user) {
      loadCartItems();
      loadUserAddresses();
    }
  }, [user]);

  const loadCartItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          price,
          products (
            name,
            description
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserAddresses(data || []);
      
      // Auto-select default address
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setFormData(prev => ({
          ...prev,
          customerAddress: `${defaultAddress.full_address}, ${defaultAddress.city}, ${defaultAddress.state} - ${defaultAddress.pincode}`,
        }));
      }
    } catch (error) {
      console.error('Error loading user addresses:', error);
    }
  };

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddressId(address.id);
    setFormData(prev => ({
      ...prev,
      customerAddress: `${address.full_address}, ${address.city}, ${address.state} - ${address.pincode}`,
    }));
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generateOrderNumber = () => {
    return 'TH' + Date.now().toString();
  };

  const handlePlaceOrder = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.customerAddress) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      const totalAmount = getTotalAmount();

      console.log('Creating order with data:', {
        user_id: user?.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_address: formData.customerAddress,
        notes: formData.notes,
      });

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          total_amount: totalAmount,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_address: formData.customerAddress,
          notes: formData.notes,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', orderData);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.products[0]?.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw itemsError;
      }

      // Clear cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user?.id);

      if (clearCartError) {
        console.error('Clear cart error:', clearCartError);
        // Don't throw error for cart clearing - order is already placed
      }

      Alert.alert(
        'Order Placed Successfully!',
        `Your order #${orderNumber} has been placed successfully!\n\nPayment Method: Cash on Delivery\n\nWe will contact you soon to confirm the details.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', `Failed to place order: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, isWeb && styles.headerWeb]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.products[0]?.name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{getTotalAmount().toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[styles.paymentOption, styles.paymentOptionSelected]}
            activeOpacity={1}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <Banknote size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentSubtitle}>Pay when your order arrives</Text>
              </View>
            </View>
            <View style={styles.radioSelected}>
              <View style={styles.radioInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, styles.paymentOptionDisabled]}
            activeOpacity={1}
          >
            <View style={styles.paymentLeft}>
              <View style={[styles.paymentIcon, styles.paymentIconDisabled]}>
                <CreditCard size={20} color="#9ca3af" />
              </View>
              <View>
                <Text style={[styles.paymentTitle, styles.paymentTitleDisabled]}>Online Payment</Text>
                <Text style={[styles.paymentSubtitle, styles.paymentSubtitleDisabled]}>Coming soon</Text>
              </View>
            </View>
            <View style={styles.radioDisabled} />
          </TouchableOpacity>
        </View>
        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          
          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#9ca3af"
              value={formData.customerName}
              onChangeText={(text) => setFormData({ ...formData, customerName: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor="#9ca3af"
              value={formData.customerPhone}
              onChangeText={(text) => setFormData({ ...formData, customerPhone: text })}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          {userAddresses.length > 0 && (
            <View style={styles.addressSelection}>
              <Text style={styles.label}>Select Saved Address</Text>
              {userAddresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressOption,
                    selectedAddressId === address.id && styles.addressOptionSelected
                  ]}
                  onPress={() => handleAddressSelect(address)}
                >
                  <View style={styles.addressOptionContent}>
                    <Text style={styles.addressTitle}>{address.title}</Text>
                    <Text style={styles.addressText}>
                      {address.full_address}, {address.city}, {address.state} - {address.pincode}
                    </Text>
                    {address.is_default && (
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    )}
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedAddressId === address.id && styles.radioButtonSelected
                  ]}>
                    {selectedAddressId === address.id && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={styles.addNewAddressButton}
                onPress={() => router.push('/addresses')}
              >
                <Text style={styles.addNewAddressText}>+ Add New Address</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {userAddresses.length === 0 && (
            <View style={styles.noAddressContainer}>
              <Text style={styles.noAddressText}>No saved addresses found</Text>
              <TouchableOpacity 
                style={styles.addFirstAddressButton}
                onPress={() => router.push('/addresses')}
              >
                <Text style={styles.addFirstAddressText}>Add Your First Address</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={userAddresses.length > 0 ? "Or enter custom address" : "Complete Address *"}
              placeholderTextColor="#9ca3af"
              value={formData.customerAddress}
              onChangeText={(text) => setFormData({ ...formData, customerAddress: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional Notes (Optional)"
              placeholderTextColor="#9ca3af"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total: ₹{getTotalAmount().toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.placeOrderButton, submitting && styles.placeOrderButtonDisabled]} 
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          <Text style={styles.placeOrderButtonText}>
            {submitting ? 'Placing Order...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerWeb: {
    paddingTop: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIconDisabled: {
    backgroundColor: '#f3f4f6',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentTitleDisabled: {
    color: '#9ca3af',
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentSubtitleDisabled: {
    color: '#9ca3af',
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  radioDisabled: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerTotal: {
    marginBottom: 16,
    alignItems: 'center',
  },
  footerTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeOrderButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  addressSelection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  addressOptionSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#f0f0ff',
  },
  addressOptionContent: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f59e0b',
    marginTop: 4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#7c3aed',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
  },
  addNewAddressButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7c3aed',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addNewAddressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7c3aed',
  },
  noAddressContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  noAddressText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  addFirstAddressButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addFirstAddressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});