import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import images from '../../components/data';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/authContext';

const { width, height } = Dimensions.get('window');

const MOBILE_DATA = 'http://0.0.0.0:8000'; 
const HOME_WIFI = 'http://192.168.10.218:8000';
const AWS_SERVER_URL = 'http://3.27.248.187:8000';
const GOOGLE_CLOUD_RUN_URL = 'https://petalscan-img-129264674726.asia-southeast1.run.app';



export default function PremiumFeatureScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  // Get the current user from AuthContext
  const { user } = useAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const subscriptionRef = doc(collection(db, 'subscriptions'), user.uid);
        const subscriptionDoc = await getDoc(subscriptionRef);
        if (subscriptionDoc.exists()) {
          const subscriptionData = subscriptionDoc.data();
          const isUserPremium = subscriptionData.plan === 'Monthly' && subscriptionData.status === 'active';
          setIsPremium(isUserPremium);
          console.log('User is premium:', isUserPremium);
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
  };

    const handlePayment = async () => {
    setIsLoading(true);
    setPaymentSuccess(false);
    setPaymentError(null);
    try {
      // Define the payment amount and snap count based on the selected plan
      let amount;
      let plan;
      let snapCount = 0;
      switch (selectedPlan) {
        case 'Monthly':
          amount = 499; // $4.99 in cents
          plan = 'Monthly';
          break;
        case '20 snaps':
          amount = 200; // $2.00 in cents
          plan = '20 snaps';
          snapCount = 20;
          break;
        case '10 snaps':
          amount = 150; // $1.50 in cents
          plan = '10 snaps';
          snapCount = 10;
          break;
        default:
          throw new Error('Please select a valid plan.');
      }
  
      // Step 1: Call your backend to create a payment intent or subscription
      const response = await fetch(`${GOOGLE_CLOUD_RUN_URL}/payment-intent/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, plan: selectedPlan, user_id: user.uid }), // Pass amount in cents, plan type, and user ID
      });
  
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error('Error details:', errorDetails);  // Log the error details
        throw new Error(`Failed to create payment intent: ${errorDetails.detail || response.statusText}`);
      }
  
      // Parse the response to get the client secret
      const { client_secret } = await response.json();
      console.log('Client Secret:', client_secret); // Debugging: Log the client secret
      if (!client_secret) throw new Error('Failed to retrieve payment intent client secret');
  
      // Step 2: Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: client_secret,
        merchantDisplayName: 'PetalScan',
        currencyCode: 'SGD',
        // Enable multiple payment methods
        googlePay: true,
        applePay: true,
        style: 'alwaysLight',
        allowsDelayedPaymentMethods: true,
      });
  
      if (initError) throw new Error(`Failed to initialize payment sheet: ${initError.message}`);
  
      // Step 3: Present the payment sheet to the user
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          setPaymentError('Payment Canceled: You canceled the payment.');
        } else {
          setPaymentError(`Payment Error: ${paymentError.message}`);
          console.error('Payment error:', paymentError); // Log the error for debugging
        }
      } else {
        // Update the user's snap count and user type in Firestore
        const userRef = doc(collection(db, 'users'), user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newSnapCount = (userData.snaps || 0) + snapCount;
          const updates = { snaps: newSnapCount };
          if (plan === 'Monthly') {
            updates.userType = 'premium';
            // Check if subscription already exists
            const subscriptionRef = doc(collection(db, 'subscriptions'), user.uid);
            const subscriptionDoc = await getDoc(subscriptionRef);
            if (subscriptionDoc.exists()) {
              // Update existing subscription
              await updateDoc(subscriptionRef, {
                plan,
                amount,
                status: 'active',
                updatedAt: serverTimestamp(),
              });
            } else {
              // Add new subscription to Firestore for premium plan
              await setDoc(subscriptionRef, {
                uid: user.uid, // Use the current user's UID
                plan,
                amount,
                status: 'active',
                createdAt: serverTimestamp(),
              });
            }
          }
          await updateDoc(userRef, updates);
          console.log('User updated:', updates);
        }
  
        setPaymentSuccess(true);
        setIsPremium(plan === 'Monthly');
        console.log('User is premium after payment:', plan === 'Monthly');
      }
    } catch (error) {
      setPaymentError(`Error: ${error.message}`);
      console.error('Payment process error:', error); // Log the error for debugging
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // Update the subscription status to 'canceled'
      const subscriptionRef = doc(collection(db, 'subscriptions'), user.uid);
      await updateDoc(subscriptionRef, { status: 'canceled' });

      // Update the user's userType to 'normal'
      const userRef = doc(collection(db, 'users'), user.uid);
      await updateDoc(userRef, { userType: 'normal' });

      setIsPremium(false);
      setPaymentSuccess(true);
      console.log('User is premium after cancellation:', false);
    } catch (error) {
      setPaymentError(`Error: ${error.message}`);
      console.error('Cancel subscription error:', error); // Log the error for debugging
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={require('../../assets/images/parkImage.jpg')} style={styles.backgroundImage} />

      {/* Premium Feature Content */}
      <View style={styles.contentContainer}>
        {/* Back button */}
        <TouchableOpacity style={styles.logo} onPress={() => router.push('/home')}>
          <Image source={images.backArrowIcon} style={styles.arrow} />
        </TouchableOpacity>

        <Text style={styles.title}>PetalScan</Text>
        <Text style={styles.subtitle}>
          Experience the full potential of PetalScan with our premium features!
        </Text>
        
        <View style={styles.benefitContainer}>
          <Text style={styles.benefit}>No advertisements</Text>
          <Text style={styles.benefit}>Unlimited scans</Text>
          <Text style={styles.benefit}>20 Petal-GPT prompts daily</Text>
          <Text style={styles.benefit}>Real-time image recognition</Text>
        </View>

        {isPremium ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.planContainer}>
              <TouchableOpacity
                style={[styles.plan, selectedPlan === 'Monthly' && styles.selectedPlan]}
                onPress={() => handlePlanSelection('Monthly')}
              >
                <Text style={styles.planType}>Premium</Text>
                <Text style={styles.planPrice}>$4.99/month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.plan, selectedPlan === '20 snaps' && styles.selectedPlan]}
                onPress={() => handlePlanSelection('20 snaps')}
              >
                <Text style={styles.planType}>20 Scan Bundle</Text>
                <Text style={styles.planPrice}>$2.00</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.plan, selectedPlan === '10 snaps' && styles.selectedPlan]}
                onPress={() => handlePlanSelection('10 snaps')}
              >
                <Text style={styles.planType}>10 Scan Bundle</Text>
                <Text style={styles.planPrice}>$1.50</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, !selectedPlan && styles.disabledButton]}
              onPress={handlePayment}
              disabled={!selectedPlan || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={paymentSuccess || paymentError !== null}
          onRequestClose={() => {
            setPaymentSuccess(false);
            setPaymentError(null);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => {
                  setPaymentSuccess(false);
                  setPaymentError(null);
                }}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
              {paymentSuccess && (
                <>
                  <LottieView
                    source={require('../../assets/animations/successAnimation.json')}
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                  />
                  <Text style={styles.successText}>Success!</Text>
                </>
              )}
              {paymentError && (
                <>
                  <LottieView
                    source={require('../../assets/animations/errorAnimation.json')}
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                  />
                  <Text style={styles.errorText}>{paymentError}</Text>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Text style={styles.termsText}>
          By placing this order, you agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>. 
          Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
        </Text>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    position: 'absolute',
    top: height * 0.03,
    left: width * 0.03,
  },
  arrow: {
    width: width * 0.07,
    height: width * 0.07,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    width: '90%',
    height: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    marginTop: height * 0.05, // Move contents a bit more to the top
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20, // Adjusted margin top
    color: '#0D368C',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#092765',
    //borderWidth: 1,
    width: '80%',
  },

  benefitContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  benefit: {
    fontSize: 18,
    marginBottom: 10,
    color: '#000',
    fontWeight: 'bold',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  planContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  plan: {
    borderWidth: 1,
    borderColor: '#092765',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  selectedPlan: {
    backgroundColor: '#d3e4f2',
  },
  planType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D368C',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D368C',
  },

  cancelText: {
    fontSize: 14,
    color: '#8391A1',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 110,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#FF4C4C', // Softer red color
    paddingVertical: 10, // Reduced padding
    paddingHorizontal: 20, // Reduced padding
    borderRadius: 10, // Slightly rounded corners
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignSelf: 'center', // Center the button
  },
  cancelButtonText: {
    fontSize: 16, // Slightly smaller font size
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center', // Ensure text is centered
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeIconText: {
    fontSize: 24,
    color: '#000',
  },
  lottie: {
    width: 150,
    height: 150,
  },
  successText: {
    color: '#155724',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#721c24',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#8391A1',
  },
  linkText: {
    color: '#0D368C',
    textDecorationLine: 'underline',
  },
});