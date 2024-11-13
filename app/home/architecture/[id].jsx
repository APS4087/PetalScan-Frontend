import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import images from '../../../components/data';
import Swiper from 'react-native-swiper';
import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/authContext';
import LottieView from 'lottie-react-native';
import platloadinganimation from '.././../../assets/animations/plantLoadingAnimation.json';
import locationIcon from '../../../assets/Icons/location.png';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

const ArchitectureDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [architecture, setArchitecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [remainingQuestions, setRemainingQuestions] = useState(0);
  const flatListRef = useRef(null);
  const { user } = useAuth();

  const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY, 
  });

  useEffect(() => {
    const fetchArchitecture = async () => {
      try {
        const docRef = doc(db, 'architectures', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) { 
          const architectureData = docSnap.data();
          setArchitecture(architectureData);

          // Generate a short description using GPT-4o mini
          const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `You are a helpful assistant. Provide a short description for the following architecture: ${architectureData.name} from Singapore Botanic Garden. Only respond to questions related to this architecture detail and politely decline any off-topic questions.` },
            ],
            max_tokens: 50,
          });

          const description = chatCompletion.choices[0].message.content.trim();

          setMessages([
            { text: description, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { text: `Hi, I am Petal-GPT. You can ask me more about ${architectureData.name}.`, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
        } else {
          setError('No such document!');
        }
      } catch (error) {
        setError('Failed to load data.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArchitecture();
  }, [id, user]);

  useEffect(() => {
    const checkAndResetQuestions = async () => {
      const lastResetTime = await AsyncStorage.getItem('lastQuestionResetTime');
      const currentTime = new Date().getTime();
      const userRef = doc(collection(db, 'users'), user.uid);
      const userDoc = await getDoc(userRef);
      let limit = 5; // Default limit for normal users

      if (userDoc.exists()) {
        const userData = userDoc.data();
        limit = userData.userType === 'premium' ? 20 : 5;
      }

      if (!lastResetTime || currentTime - parseInt(lastResetTime) > 24 * 60 * 60 * 1000) {
        // More than 24 hours have passed since the last reset
        setRemainingQuestions(limit);
        await AsyncStorage.setItem('lastQuestionResetTime', currentTime.toString());
        await AsyncStorage.setItem('remainingQuestions', limit.toString());
      } else {
        const storedQuestions = await AsyncStorage.getItem('remainingQuestions');
        if (storedQuestions) {
          setRemainingQuestions(parseInt(storedQuestions));
        }
      }

      // Ensure remaining questions do not go below zero
      if (remainingQuestions < 0) {
        setRemainingQuestions(0);
        await AsyncStorage.setItem('remainingQuestions', '0');
      }

      // Ensure remaining questions do not exceed the limit
      if (remainingQuestions > limit) {
        setRemainingQuestions(limit);
        await AsyncStorage.setItem('remainingQuestions', limit.toString());
      }
    };
    checkAndResetQuestions();
  }, [user]);

  useEffect(() => {
    // Ensure remaining questions do not go below zero
    if (remainingQuestions < 0) {
      setRemainingQuestions(0);
      AsyncStorage.setItem('remainingQuestions', '0');
    }
  }, [remainingQuestions]);

  const handleSend = async () => {
    if (remainingQuestions <= 0) {
      alert(`You have reached the limit of questions for today.`);
      return;
    }

    const userMessage = { 
      text: inputText, 
      sender: 'user', 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages([...messages, userMessage]);
    setInputText('');
    setRemainingQuestions(remainingQuestions - 1);
    await AsyncStorage.setItem('remainingQuestions', (remainingQuestions - 1).toString());

    try {
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a helpful assistant. Provide detailed answers based on the following information about the architecture: ${architecture.name}. You can also use your broader knowledge to provide more context and details.` },
          { role: 'user', content: inputText },
        ],
        max_tokens: 150,
      });

      const botMessage = { 
        text: chatCompletion.choices[0].message.content.trim(), 
        sender: 'bot', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages([...messages, userMessage, botMessage]);
      flatListRef.current.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error fetching GPT-4 response:', error);
      if (error.message.includes('429')) {
        Alert.alert('Quota Exceeded', 'You have exceeded your current quota. Please check your plan and billing details.');
      } else {
        Alert.alert('Error', 'There was an error processing your request. Please try again later.');
      }
    }
  };

  const viewOnMap = () => {
    if (architecture && architecture.name) {
      const query = `${architecture.name} Singapore Botanic Garden`;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Location not available', 'The location of this architecture is not available.');
    }
  };

  const resetQuestions = async () => {
    const userRef = doc(collection(db, 'users'), user.uid);
    const userDoc = await getDoc(userRef);
    let limit = 5; // Default limit for normal users

    if (userDoc.exists()) {
      const userData = userDoc.data();
      limit = userData.userType === 'premium' ? 20 : 5;
    }

    setRemainingQuestions(limit);
    await AsyncStorage.setItem('remainingQuestions', limit.toString());
    await AsyncStorage.setItem('lastQuestionResetTime', new Date().getTime().toString());
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={platloadinganimation}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Image source={images.backArrowIcon} style={styles.arrow} />
        </TouchableOpacity>
        {/* View on Map icon and text */}
        <TouchableOpacity style={styles.mapIconContainer} onPress={viewOnMap} accessibilityLabel="View on Map">
          <Text style={styles.mapText}>View on Map</Text>
          <Image source={locationIcon} style={styles.locationIcon} />
        </TouchableOpacity>
        {architecture && (
          <>
            <View style={styles.carouselContainer}>
              <Swiper
                style={styles.wrapper}
                showsButtons={false}
                autoplay={true}
                autoplayTimeout={3}
                loop={true}
                renderPagination={(index, total, context) => (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity onPress={() => context.scrollBy(-1)} style={styles.arrowButton}>
                      <Text style={styles.buttonText}>‹</Text>
                    </TouchableOpacity>
                    <View style={styles.dotsContainer}>
                      {Array.from({ length: total }).map((_, i) => (
                        <View key={i} style={i === index ? styles.activeDot : styles.dot} />
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => context.scrollBy(1)} style={styles.arrowButton}>
                      <Text style={styles.buttonText}>›</Text>
                    </TouchableOpacity>
                  </View>
                )}
              >
                {Array.isArray(architecture.imageUrl) ? (
                  architecture.imageUrl.map((url, index) => (
                    <View key={index} style={styles.slide}>
                      <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                    </View>
                  ))
                ) : (
                  <View style={styles.slide}>
                    <Image source={{ uri: architecture.imageUrl }} style={styles.image} resizeMode="cover" />
                  </View>
                )}
              </Swiper>
            </View>
            <Text style={styles.title}>{architecture.name}</Text>
          </>
        )}
        <View style={styles.chatContainer}>
          <Text style={styles.questionCounter}>Questions Left: {remainingQuestions}</Text>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => (
              <View style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question..."
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
          {/* {__DEV__ && (
            <TouchableOpacity style={styles.resetButton} onPress={resetQuestions}>
              <Text style={styles.resetButtonText}>Reset Questions</Text>
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: '4%',
    marginTop: '2%',
  },
  backButton: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    zIndex: 1,
  },
  mapIconContainer: {
    position: 'absolute',
    top: '5%',
    right: '5%',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 25,
    height: 25,
  },
  mapText: {
    marginLeft: 5,
    color: '#004d40',
    fontSize: 16,
  },
  arrow: {
    width: 25,
    height: 25,
  },
  carouselContainer: {
    height: '30%', 
    marginTop: '20%',
    marginBottom: '5%',
    borderRadius: 20,
  },
  wrapper: {
    height: '100%',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20, // Rounded edges
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  arrowButton: {
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: 'rgba(0,0,0,.2)',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
  },
  activeDot: {
    backgroundColor: '#000',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
  },
  buttonText: {
    color: '#000',
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 130,
    height: 130,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
    marginTop: 20,
  },
  questionCounter: {
    fontSize: 16,
    color: '#004d40',
    textAlign: 'center',
    marginBottom: 10,
  },
  chatContent: {
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#004d40',
    padding: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#004d40',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  sendButton: {
    backgroundColor: '#004d40',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: 70, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16, 
    width: '100%',
  },
  resetButton: {
    backgroundColor: '#FF6347',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  message: {
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
    maxWidth: '80%',
    flexShrink: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50', // Nature-themed color for user message (Green)
    borderBottomRightRadius: 0,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#8FBC8F', // Nature-themed color for bot message (Dark Sea Green)
    borderBottomLeftRadius: 0,
  },
  messageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#004d40',
    marginTop: 5,
    alignSelf: 'flex-end',
    width: 35,
  },
});

export default ArchitectureDetail;