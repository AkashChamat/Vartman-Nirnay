import {StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native';
import React from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import LinearGradient from 'react-native-linear-gradient';

const RefundPolicy = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <LinearGradient
        colors={['#f8fbff', '#ffffff']}
        style={styles.gradientContainer}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.heading}>Refund Policy</Text>
            <View style={styles.divider} />
            <Text style={styles.introText}>
              This is the Refund Policy for VARTMAN NIRNAY. We aim to provide clear 
              and fair refund terms for all our customers.
            </Text>
          </View>

          {/* Section 1: Eligibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>1.</Text> Eligibility for Refunds
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Refunds can be requested for digital or physical products within
                  2 days of purchase if the product is defective or not as described
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Refund requests for eBooks may be considered under specific
                  circumstances, such as accidental duplicate purchases
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: How to Request */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>2.</Text> How to Request a Refund
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <View style={styles.bulletContent}>
                  <Text style={styles.bulletText}>
                    To request a refund, please contact us at{' '}
                    <Text style={styles.phoneHighlight}>+91 98694 51560</Text> with your order
                    number and reason for the refund
                  </Text>
                </View>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Refunds will be processed through the original payment method
                  within 5 days of approval
                </Text>
              </View>
            </View>
          </View>

          {/* Section 3: Non-Refundable Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>3.</Text> Non-Refundable Items
            </Text>
            <View style={styles.warningCard}>
              <View style={styles.bulletPoint}>
                <View style={styles.warningDot} />
                <Text style={styles.bulletText}>
                  Certain items, such as promotional or discounted products, may
                  not be eligible for a refund
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>4.</Text> Contact Us
            </Text>
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>
                If you have any questions about our refund policy, please contact us at:
              </Text>
              <Text style={styles.phoneNumber}>+91 98694 51560</Text>
            </View>
          </View>

          {/* Additional Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Quick Tip</Text>
            <Text style={styles.infoText}>
              For faster processing, please have your order number ready when contacting us
              about refunds. Our team is here to help resolve any issues quickly.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
      <Footer />
    </SafeAreaView>
  );
};

export default RefundPolicy;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#27ae60',
    borderRadius: 2,
    marginBottom: 20,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5a6c7d',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign:'center'
  },
  sectionNumber: {
    color: '#27ae60',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8f8f0',
  },
  warningCard: {
    backgroundColor: '#fff9e6',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#27ae60',
    marginTop: 8,
    marginRight: 12,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f39c12',
    marginTop: 8,
    marginRight: 12,
  },
  bulletContent: {
    flex: 1,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5a6c7d',
  },
  phoneHighlight: {
    color: '#27ae60',
    fontWeight: '600',
  },
  contactSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#e8f8f0',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#a8e6cf',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 15,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#90caf9',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5a6c7d',
  },
});