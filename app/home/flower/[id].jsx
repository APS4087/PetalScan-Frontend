import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import images from '../../../components/data';
import Swiper from 'react-native-swiper';
import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/authContext';
import LottieView from 'lottie-react-native';
import platloadinganimation from '../../../assets/animations/plantLoadingAnimation.json';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

const FlowerDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [flower, setFlower] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [questionLimit, setQuestionLimit] = useState(5); // Default to 5
  const flatListRef = useRef(null);
  const { user } = useAuth();

  const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY, 
  });

  useEffect(() => {
    const fetchFlower = async () => {
      try {
        const docRef = doc(db, 'flowers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const flowerData = docSnap.data();
          setFlower(flowerData);

          // Generate a short description using GPT-4o mini
          const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `You are a helpful assistant. Provide a short description for the following flower: ${flowerData.name} from Singapore Botanic Garden. Only respond to questions related to this flower detail and politely decline any off-topic questions.` },
            ],
            max_tokens: 50,
          });

          const description = chatCompletion.choices[0].message.content.trim();

          setMessages([
            { text: description, sender: 'bot', timestamp: new Date().toLocaleTimeString() },
            { text: `Hi, I am Petal-GPT. You have ${questionLimit} free questions you can ask me about ${flowerData.name}.`, sender: 'bot', timestamp: new Date().toLocaleTimeString() }
          ]);
        } else {
          setError('No such document!');
        }
      } catch (error) {
        setError('Failed to load flower.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlower();
  }, [id]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(collection(db, 'users'), user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const limit = userData.userType === 'premium' ? 20 : 5;
          setQuestionLimit(limit);
          setMessages([
            { text: `Hi, I am Petal-GPT. You have ${limit} daily free questions you can ask me about ${flower?.name}.`, sender: 'bot', timestamp: new Date().toLocaleTimeString() }
          ]);
        } else {
          console.error('No such user!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const checkAndResetQuestionCount = async () => {
      const lastResetTime = await AsyncStorage.getItem('lastQuestionResetTime');
      const currentTime = new Date().getTime();
      if (!lastResetTime || currentTime - parseInt(lastResetTime) > 24 * 60 * 60 * 1000) {
        // More than 24 hours have passed since the last reset
        setQuestionCount(0);
        await AsyncStorage.setItem('lastQuestionResetTime', currentTime.toString());
      } else {
        const storedQuestionCount = await AsyncStorage.getItem('questionCount');
        if (storedQuestionCount) {
          setQuestionCount(parseInt(storedQuestionCount));
        }
      }
    };
    checkAndResetQuestionCount();
  }, []);

  const handleSend = async () => {
    if (questionCount >= questionLimit) {
      alert(`You have reached the limit of ${questionLimit} questions.`);
      return;
    }

    const userMessage = { text: inputText, sender: 'user', timestamp: new Date().toLocaleTimeString() };
    setMessages([...messages, userMessage]);
    setInputText('');
    setQuestionCount(questionCount + 1);
    await AsyncStorage.setItem('questionCount', (questionCount + 1).toString());

    try {
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a helpful assistant. Provide detailed answers based on the following information about the flower: ${flower.name}. You can also use your broader knowledge to provide more context and details.` },
          { role: 'user', content: inputText },
        ],
        max_tokens: 150,
      });

      const botMessage = { text: chatCompletion.choices[0].message.content.trim(), sender: 'bot', timestamp: new Date().toLocaleTimeString() };
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
        {flower && (
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
                {Array.isArray(flower.imageUrl) ? (
                  flower.imageUrl.map((url, index) => (
                    <View key={index} style={styles.slide}>
                      <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                    </View>
                  ))
                ) : (
                  <View style={styles.slide}>
                    <Image source={{ uri: flower.imageUrl }} style={styles.image} resizeMode="cover" />
                  </View>
                )}
              </Swiper>
            </View>
            <Text style={styles.title}>{flower.name}</Text>
          </>
        )}
        <View style={styles.chatContainer}>
          <Text style={styles.questionCounter}>Questions Left: {questionLimit - questionCount}</Text>
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
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '4%',
    marginTop: '2%',
  },
  backButton: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    zIndex: 1,
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
    color: '#aaa',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
});

export default FlowerDetail;