import {StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native';
import React from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';

const ShippingPolicy = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Shipping Policy</Text>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>
              Clear and transparent shipping terms for PJSOFTECH PVT. LTD.
            </Text>
          </View>

          {/* Content Sections */}
          <View style={styles.contentContainer}>
            
            {/* Section 1 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>1</Text>
                </View>
                <Text style={styles.sectionTitle}>Shipping Methods</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  📦 We offer various shipping methods to deliver physical products purchased through our platform
                </Text>
                <Text style={styles.bulletPoint}>
                  🚚 Shipping fees and delivery times depend on your location and the chosen shipping method
                </Text>
              </View>
            </View>

            {/* Section 2 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>2</Text>
                </View>
                <Text style={styles.sectionTitle}>Shipping Timeline</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  ⏱️ Orders are processed within <Text style={styles.highlight}>[Processing Time]</Text> business days
                </Text>
                <Text style={styles.bulletPoint}>
                  📅 Delivery times typically range from 4 – 8 business days based on your location and chosen shipping method
                </Text>
              </View>
            </View>

            {/* Section 3 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>3</Text>
                </View>
                <Text style={styles.sectionTitle}>International Shipping</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  🌍 International shipping may be available depending on your location
                </Text>
                <Text style={styles.bulletPoint}>
                  💰 Additional customs fees or taxes may apply according to your country's regulations
                </Text>
              </View>
            </View>

            {/* Section 4 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>4</Text>
                </View>
                <Text style={styles.sectionTitle}>Lost or Damaged Items</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  📞 If an item is lost or damaged during shipping, please contact us at{' '}
                  <Text style={styles.phoneNumber}>+99 2357 0901</Text> within 2 days of the expected delivery date
                </Text>
              </View>
            </View>

            {/* Section 5 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>5</Text>
                </View>
                <Text style={styles.sectionTitle}>Contact Us</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.contactCard}>
                  <Text style={styles.contactText}>
                    For any questions regarding shipping, please contact us at:
                  </Text>
                  <Text style={styles.phoneNumber}>+99 2357 0901</Text>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </View>
      
      <Footer />
    </SafeAreaView>
  );
};

export default ShippingPolicy;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#4299e1',
    borderRadius: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  sectionContent: {
    padding: 20,
  },
  bulletPoint: {
    fontSize: 13,
    lineHeight: 24,
    color: '#4a5568',
    marginBottom: 12,
    // paddingLeft: 4,
  },
  highlight: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phoneNumber: {
    color: '#4299e1',
    fontWeight: '600',
    fontSize: 16,
  },
  contactCard: {
    backgroundColor: '#e6fffa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#38b2ac',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 13,
    color: '#2c7a7b',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
});