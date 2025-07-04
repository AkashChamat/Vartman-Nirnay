import {StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native';
import React from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import LinearGradient from 'react-native-linear-gradient';

const Privacy = () => {
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
            <Text style={styles.heading}>Privacy Policy</Text>
            <View style={styles.divider} />
            <Text style={styles.introText}>
              At VARTMAN NIRNAY, we value your privacy and are committed to
              protecting your personal information. This Privacy Policy outlines
              the types of data we collect, how we use it, and your rights
              regarding your personal data.
            </Text>
          </View>

          {/* Section 1 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>1.</Text> Information We Collect
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <View style={styles.bulletContent}>
                  <Text style={styles.bulletTitle}>Personal Information:</Text>
                  <Text style={styles.bulletText}>
                    When you create an account, make a purchase, or contact us, we may collect
                    information such as your name, email address, billing and shipping
                    addresses, and payment details.
                  </Text>
                </View>
              </View>
              
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <View style={styles.bulletContent}>
                  <Text style={styles.bulletTitle}>Usage Data:</Text>
                  <Text style={styles.bulletText}>
                    We collect information on how you use the application, including your
                    interactions with eBooks, reading history, and device information.
                  </Text>
                </View>
              </View>
              
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <View style={styles.bulletContent}>
                  <Text style={styles.bulletTitle}>Cookies and Tracking Technologies:</Text>
                  <Text style={styles.bulletText}>
                    We may use cookies and other tracking technologies to improve your
                    experience on our site and for analytics purposes.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section 2 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>2.</Text> How We Use Your Information
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>Provide and improve our eBook services</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Process transactions and communicate with you regarding your purchases
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Personalize your reading experience based on your preferences
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Send promotional offers and updates, which you can opt-out of at any time
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>Analyze usage trends to improve our offerings</Text>
              </View>
            </View>
          </View>

          {/* Section 3 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>3.</Text> Data Sharing and Security
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  We do not sell your personal information. We may share your data
                  with trusted third-party service providers (e.g., payment
                  processors), but they are bound by confidentiality agreements
                </Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  We implement appropriate security measures to protect your data
                  from unauthorized access, alteration, or disclosure
                </Text>
              </View>
            </View>
          </View>

          {/* Section 4 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>4.</Text> Your Rights
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>Access the personal information we hold about you</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>Request correction or deletion of your data</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>Opt-out of marketing communications</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>Withdraw your consent to the processing of your data</Text>
              </View>
            </View>
          </View>

          {/* Section 5 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>5.</Text> Data Retention
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  We retain your personal data only as long as necessary to fulfill
                  the purposes outlined in this policy or as required by law
                </Text>
              </View>
            </View>
          </View>

          {/* Section 6 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>6.</Text> Changes to This Privacy Policy
            </Text>
            <View style={styles.card}>
              <View style={styles.bulletPoint}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  We may update this Privacy Policy from time to time. We will
                  notify you of any significant changes by posting the new policy on
                  our website and updating the date at the top
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionNumber}>7.</Text> Contact Us
            </Text>
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>
                If you have any questions or concerns regarding this Privacy Policy, 
                please contact us at:
              </Text>
              <Text style={styles.phoneNumber}>+91 9869451560</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
      <Footer />
    </SafeAreaView>
  );
};

export default Privacy;

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
    backgroundColor: '#3498db',
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
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign:'center'
  },
  sectionNumber: {
    color: '#3498db',
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
    borderColor: '#e8f4fd',
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
    backgroundColor: '#3498db',
    marginTop: 8,
    marginRight: 12,
  },
  bulletContent: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5a6c7d',
  },
  contactSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#e8f6ff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bde3ff',
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
    color: '#3498db',
    textAlign: 'center',
  },
});