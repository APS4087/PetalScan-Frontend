import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OpenAI from 'openai';
import { getFirestore, doc, getDoc, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../../context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import platloadinganimation from '../../../../assets/animations/plantLoadingAnimation.json';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

// Utility function to convert string to capital case
const toCapitalCase = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

const ImageDetail = () => {
  const router = useRouter();
  const { name, userId } = useLocalSearchParams(); // Assuming userId is passed as a parameter
  const [loading, setLoading] = useState(true);
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
    const fetchUserDataAndDescription = async () => {
      try {
        // Fetch user data
        const userRef = doc(collection(db, 'users'), user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const limit = userData.userType === 'premium' ? 20 : 5;
          setQuestionLimit(limit);

          // Generate a short description using GPT-4o mini
          const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `You are a helpful assistant. Provide a short description for the following image detail: ${name}. Only respond to questions related to this image detail and politely decline any off-topic questions.` },
            ],
            max_tokens: 50,
          });

          const description = chatCompletion.choices[0].message.content.trim();

          setMessages([
            { text: description, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { text: `Hi, I am Petal-GPT. You have ${limit} daily free questions you can ask me about ${name}.`, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
        } else {
          console.error('No such user!');
        }
      } catch (error) {
        console.error('Error fetching user data or generating description:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndDescription();
  }, [name, userId]);

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

    const userMessage = { text: inputText, sender: 'user', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, userMessage]);
    setInputText('');
    setQuestionCount(questionCount + 1);
    await AsyncStorage.setItem('questionCount', (questionCount + 1).toString());

    try {
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a helpful assistant. Provide detailed answers based on the following information about the image: ${name}. It is located in Singapore Botanic garden. You can also use your broader knowledge to provide more context and details.` },
          { role: 'user', content: inputText },
        ],
        max_tokens: 150,
      });

      const botMessage = { text: chatCompletion.choices[0].message.content.trim(), sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{toCapitalCase(name)}</Text>
        <Text style={styles.questionCounter}>Questions Left: {questionLimit - questionCount}</Text>
        <View style={styles.chatContainer}>
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
    //backgroundColor: '#e0f7fa',
    padding: viewportWidth * 0.04,
  },
  backButton: {
    position: 'absolute',
    top: viewportHeight * 0.05,
    left: viewportWidth * 0.05,
    width: 50,
    zIndex: 1,
  },
  backButtonText: {
    color: '#004d40',
    fontSize: viewportWidth * 0.04,
  },
  title: {
    fontSize: viewportWidth * 0.06,
    fontWeight: 'bold',
    marginTop: viewportHeight * 0.07,
    marginBottom: viewportHeight * 0.02,
    textAlign: 'center',
    color: '#004d40',
  },
  questionCounter: {
    fontSize: viewportWidth * 0.04,
    color: '#004d40',
    textAlign: 'center',
    marginBottom: viewportHeight * 0.02,
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
  chatContainer: {
    flex: 1,
    marginTop: viewportHeight * 0.02,
  },
  chatContent: {
    paddingBottom: viewportHeight * 0.02,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#004d40',
    padding: viewportWidth * 0.02,
  },
  input: {
    flex: 1,
    height: viewportHeight * 0.05,
    borderColor: '#004d40',
    borderWidth: 1,
    borderRadius: viewportWidth * 0.05,
    paddingHorizontal: viewportWidth * 0.02,
    marginRight: viewportWidth * 0.02,
    backgroundColor: '#ffffff',
  },
  sendButton: {
    backgroundColor: '#004d40',
    borderRadius: viewportWidth * 0.05,
    paddingVertical: viewportHeight * 0.01,
    paddingHorizontal: viewportWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: viewportWidth * 0.04,
    width: 40,
  },
  message: {
    padding: viewportWidth * 0.03,
    borderRadius: viewportWidth * 0.05,
    marginVertical: viewportHeight * 0.01,
    maxWidth: '80%',
    flexShrink: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50', // Nature-themed color for user message (Green)
    borderBottomRightRadius: 0,
    maxWidth: '80%',
    flexShrink: 1,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#8FBC8F', // Nature-themed color for bot message (Dark Sea Green)
    borderBottomLeftRadius: 0,
    maxWidth: '80%',
    flexShrink: 1,
  },
  messageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: viewportWidth * 0.03,
    color: '#004d40',
    marginTop: viewportHeight * 0.005,
    alignSelf: 'flex-end',
    width: 35,
  },
});

export default ImageDetail;