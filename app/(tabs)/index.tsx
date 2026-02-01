import { Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location'; // <- ADDED

import {
  Hop as HomeIcon,
  Plus,
  ShoppingCart,
  MessageCircle,
  MapPin,
  User,
  Users,
  Baby,
  Scissors,
  Shirt,
  Search,
  ChevronDown,
  Navigation,
} from 'lucide-react-native';

interface Category {
  id: string;
  name: string;
  slug: string;
}


interface ServiceType {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  service_type_id: string;
  image_url?: string | null;
}

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [cartCount, setCartCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState('Hyderabad');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [availableLocations] = useState([
    'Hyderabad', 'Vijayawada', 'Visakhapatnam', 'Guntur', 'Nellore', 
    'Kurnool', 'Rajahmundry', 'Tirupati', 'Anantapur', 'Chittoor'
  ]);

  useEffect(() => {
    loadData();
    fetchCurrentLocation(); // <- ADDED: attempt live pickup on first load
  }, []);

  useEffect(() => {
    if (user) {
      loadCartCount();
    }
  }, [user]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
    loadData();
    if (user) {
      loadCartCount();
    }
    }, [user])
  );

  const loadData = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) {
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      }

      const { data: serviceTypesData } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (serviceTypesData) {
        setServiceTypes(serviceTypesData);
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (productsData) {
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCartCount = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
      setCartCount(total);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }

    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (existingItem) {
        // Update quantity if item exists
        const { error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (error) throw error;
        Alert.alert('Success', 'Item quantity updated in cart!');
      } else {
        // Insert new item if it doesn't exist
      const { error } = await supabase
        .from('cart_items')
          .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          price: product.price,
        });

      if (error) throw error;
        Alert.alert('Success', 'Item added to cart!');
      }

      loadCartCount();
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleWhatsAppOrder = () => {
    const phoneNumber = '+919876543210';
    const message = encodeURIComponent(
      `Hi! I would like to place an order from Tailor Hub. Please help me with the available services and pricing.`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp. Please make sure WhatsApp is installed.');
    });
  };

  // ---------- NEW: fetchCurrentLocation ----------
  const fetchCurrentLocation = async () => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // user denied permission, keep manual fallback
        console.warn('Location permission not granted');
        return;
      }

      // get position
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // reverse geocode to get city/region
      const addresses = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const first = addresses[0];
        // pick best available label
        const city = first.city || first.subregion || first.region || first.name || 'Unknown';
        setCurrentLocation(city);
        setShowLocationPicker(false);
      }
    } catch (err) {
      console.error('fetchCurrentLocation error:', err);
    }
  };
  // ---------- END NEW ----------

  // Updated to prompt user for method (auto / manual)
  const handleLocationPicker = () => {
    Alert.alert(
      'Choose Location',
      'How do you want to select location?',
      [
        { text: 'Use Current Location', onPress: fetchCurrentLocation },
        { text: 'Choose Manually', onPress: () => setShowLocationPicker(!showLocationPicker) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const selectLocation = (location: string) => {
    setCurrentLocation(location);
    setShowLocationPicker(false);
    
    // Check if location is in service area
    if (!availableLocations.includes(location)) {
      Alert.alert(
        'Service Area',
        'We are expanding to your area soon! Thank you for your interest. We will notify you once we start serving in your location.',
        [{ text: 'OK' }]
      );
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'male':
        return <User size={24} color="#7c3aed" />;
      case 'female':
        return <Users size={24} color="#ec4899" />;
      case 'children':
        return <Baby size={24} color="#10b981" />;
      default:
        return <Shirt size={24} color="#6b7280" />;
    }
  };

  const filteredServiceTypes = serviceTypes.filter(st => st.category_id === selectedCategory);
  const filteredProducts = products.filter(p => {
    const matchesCategory = p.category_id === selectedCategory;
    const matchesServiceType = !selectedServiceType || p.service_type_id === selectedServiceType;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesServiceType && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7c3aed', '#a855f7']} style={[styles.header, isWeb && styles.headerWeb]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.locationRow} onPress={handleLocationPicker}>
                <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.locationText}>{currentLocation}</Text>
                <ChevronDown size={16} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
              <Text style={styles.appName}>Tailor Hub</Text>
            </View>
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => router.push('/(tabs)/cart')}
            >
              <ShoppingCart size={24} color="#ffffff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Search Bar in Header */}
          <View style={styles.headerSearchContainer}>
            <View style={styles.headerSearchBar}>
              <Search size={18} color="#ffffff" style={{ opacity: 0.85 }} />
              <TextInput
                style={styles.headerSearchInput}
                placeholder="Search for tailoring services..."
                placeholderTextColor="rgba(255, 255, 255, 0.75)"  // 👈 FIX
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Picker Dropdown */}
        {showLocationPicker && (
          <View style={styles.locationDropdown}>
            <Text style={styles.dropdownTitle}>Select Your Location</Text>
            <ScrollView style={styles.locationList} nestedScrollEnabled>
              {availableLocations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.locationItem,
                    currentLocation === location && styles.locationItemSelected
                  ]}
                  onPress={() => selectLocation(location)}
                >
                  <Text style={[
                    styles.locationItemText,
                    currentLocation === location && styles.locationItemTextSelected
                  ]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}


        {/* Service Action Buttons */}
        <View style={styles.actionButtonsContainer}>
  {/* Get Tailor at Home */}
  <TouchableOpacity 
    style={[styles.actionButton, styles.highlightedButton]}
    onPress={() => router.push('/home-service')}
  >
    <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.actionButtonGradient}>
      <HomeIcon size={18} color="#ffffff" />
      <Text style={styles.actionButtonText}>Get Tailor at Home</Text>
    </LinearGradient>
  </TouchableOpacity>

  {/* Order on WhatsApp */}
  <TouchableOpacity 
    style={[styles.actionButton, styles.whatsappActionButton]}
    onPress={handleWhatsAppOrder}
  >
    <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.actionButtonGradient}>
      <MessageCircle size={18} color="#ffffff" />
      <Text style={styles.actionButtonText}>Order on WhatsApp</Text>
    </LinearGradient>
  </TouchableOpacity>
</View>


        {/* Category Icons */}
        <View style={styles.categoryIconsContainer}>
          <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Our Services</Text>
</View>

          <View style={styles.categoryIcons}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryIcon}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setSelectedServiceType('');
                }}
              >
                <View style={[
                  styles.categoryIconCircle,
                  selectedCategory === category.id && styles.categoryIconCircleActive
                ]}>
                  {getCategoryIcon(category.name)}
                </View>
                <Text style={[
                  styles.categoryIconText,
                  selectedCategory === category.id && styles.categoryIconTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Service Types */}
        {filteredServiceTypes.length > 0 && (
          <View style={styles.serviceTypesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceTypesContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceTypeChip,
                  !selectedServiceType && styles.serviceTypeChipActive
                ]}
                onPress={() => setSelectedServiceType('')}
              >
                <Text style={[
                  styles.serviceTypeChipText,
                  !selectedServiceType && styles.serviceTypeChipTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {filteredServiceTypes.map((serviceType) => (
                <TouchableOpacity
                  key={serviceType.id}
                  style={[
                    styles.serviceTypeChip,
                    selectedServiceType === serviceType.id && styles.serviceTypeChipActive
                  ]}
                  onPress={() => setSelectedServiceType(serviceType.id)}
                >
                  <Text style={[
                    styles.serviceTypeChipText,
                    selectedServiceType === serviceType.id && styles.serviceTypeChipTextActive
                  ]}>
                    {serviceType.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products Grid */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={[styles.productsGrid, isWeb && styles.productsGridWeb]}>
            {filteredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={[styles.productCard, isWeb && styles.productCardWeb]}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <View style={styles.productImageContainer}>
                  {product.image_url ? (
                    <Image source={{ uri: product.image_url }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Shirt size={32} color="#9ca3af" />
                    </View>
                  )}
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                </View>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                >
                  <Plus size={16} color="#ffffff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerWeb: {
    paddingTop: 20,
  },
  headerContent: {
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerSearchContainer: {
    marginTop: 16,
  },
  headerSearchBar: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  borderRadius: 14,
  paddingHorizontal: 16,
  height: 48,              // ✅ fixed height
},

  headerSearchInput: {
  flex: 1,
  fontSize: 15,
  color: '#ffffff',
  marginLeft: 10,

  backgroundColor: 'transparent', // ✅ removes inner box
  borderWidth: 0,                 // ✅ removes border
  paddingVertical: 0,             // ✅ Android fix
},

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  locationList: {
    maxHeight: 150,
  },
  locationItem: {
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  locationItemSelected: {
    backgroundColor: '#f0f0ff',
  },
  locationItemText: {
    fontSize: 14,
    color: '#111827',
  },
  locationItemTextSelected: {
    color: '#7c3aed',
    fontWeight: '500',
  },
 actionButtonsContainer: {
  flexDirection: 'row',        // 👈 ROW
  gap: 12,                     // space between buttons
  marginTop: 16,
  marginBottom: 24,
  marginHorizontal: 16,
},
 actionButton: {
  flex: 1,                     // 👈 equal width (2 columns)
  borderRadius: 10,
  overflow: 'hidden',
},

  highlightedButton: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryIconsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whatsappText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#25d366',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  categoryIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  categoryIcon: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconCircleActive: {
    backgroundColor: '#f0f0ff',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  categoryIconText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryIconTextActive: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  serviceTypesSection: {
    marginBottom: 20,
  },
  serviceTypesContainer: {
    paddingHorizontal: 4,
  },
  serviceTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceTypeChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  serviceTypeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  serviceTypeChipTextActive: {
    color: '#ffffff',
  },
  productsSection: {
    marginBottom: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productsGridWeb: {
    gap: 16,
  },
  whatsappActionButton: {
  shadowColor: '#22c55e',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
},

  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productCardWeb: {
    width: '23%',
    minWidth: 200,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  addToCartButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});
