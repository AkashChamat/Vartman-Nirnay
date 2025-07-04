import {StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native';
import React from 'react';
import Footer from '../Components/Footer';
import Header from '../Components/Header';

const TermsAndConditions = () => {
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
            <Text style={styles.title}>Terms & Conditions</Text>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>
              By accessing or using VARTMAN NIRNAY, you agree to comply with and be bound by these terms
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
                <Text style={styles.sectionTitle}>Use of the Service</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  👤 You must be at least 18 years old to use our services
                </Text>
                <Text style={styles.bulletPoint}>
                  ⚖️ You agree not to misuse the service or violate any applicable laws while using it
                </Text>
              </View>
            </View>

            {/* Section 2 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>2</Text>
                </View>
                <Text style={styles.sectionTitle}>Intellectual Property</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  📚 All content available on the platform, including eBooks, images, and text, are the intellectual property of VARTMAN NIRNAY or its licensors
                </Text>
                <Text style={styles.bulletPoint}>
                  🚫 You may not copy, distribute, or modify any of the content without prior permission
                </Text>
              </View>
            </View>

            {/* Section 3 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>3</Text>
                </View>
                <Text style={styles.sectionTitle}>Account Responsibilities</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  🔐 You are responsible for maintaining the confidentiality of your account credentials
                </Text>
                <Text style={styles.bulletPoint}>
                  📋 You are also responsible for any activities that occur under your account
                </Text>
              </View>
            </View>

            {/* Section 4 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>4</Text>
                </View>
                <Text style={styles.sectionTitle}>Payment & Refunds</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bulletPoint}>
                  💳 Payments for eBooks and other services must be completed through our payment processors
                </Text>
                <Text style={styles.bulletPoint}>
                  💰 Refunds are subject to the terms outlined in our{' '}
                  <Text style={styles.linkText}>Refund Policy</Text>
                </Text>
              </View>
            </View>

            {/* Section 5 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>5</Text>
                </View>
                <Text style={styles.sectionTitle}>Limitation of Liability</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.warningCard}>
                  <Text style={styles.warningText}>
                    ⚠️ VARTMAN NIRNAY is not responsible for any indirect, incidental, or consequential damages arising from the use of the platform
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 6 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>6</Text>
                </View>
                <Text style={styles.sectionTitle}>Modifications to the Terms</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>
                    📝 We reserve the right to modify these terms at any time. We will notify you of significant changes by posting updates on our site
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer Note */}
            {/* <View style={styles.footerNote}>
              <Text style={styles.footerText}>
                Last updated: {new Date().toLocaleDateString()}
              </Text>
              <Text style={styles.footerSubtext}>
                These terms are effective immediately upon posting
              </Text>
            </View> */}

          </View>
        </ScrollView>
      </View>
      
      <Footer />
    </SafeAreaView>
  );
};

export default TermsAndConditions;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
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
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#667eea',
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
    backgroundColor: '#f7fafc',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  sectionContent: {
    padding: 20,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4a5568',
    marginBottom: 12,
    paddingLeft: 4,
  },
  linkText: {
    color: '#667eea',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  warningCard: {
    backgroundColor: '#fef5e7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f6ad55',
  },
  warningText: {
    fontSize: 15,
    color: '#744210',
    lineHeight: 22,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#e6f3ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4299e1',
  },
  infoText: {
    fontSize: 15,
    color: '#1e3a8a',
    lineHeight: 22,
    fontWeight: '500',
  },
  footerNote: {
    backgroundColor: '#edf2f7',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
});