import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import images from '../../../components/data';
import Swiper from 'react-native-swiper';
import OpenAI from 'openai';

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
  const flatListRef = useRef(null);

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
          setMessages([
            { text: `Hi, I am Petal-GPT. You have 5 free questions you can ask me about ${flowerData.name}.`, sender: 'bot', timestamp: new Date().toLocaleTimeString() }
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

  const handleSend = async () => {
    if (questionCount >= 5) {
      alert('You have reached the limit of 5 questions.');
      return;
    }

    const userMessage = { text: inputText, sender: 'user', timestamp: new Date().toLocaleTimeString() };
    setMessages([...messages, userMessage]);
    setInputText('');
    setQuestionCount(questionCount + 1);

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
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />;
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
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
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
  chatContent: {
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007bff',
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
    backgroundColor: '#007aff',
    borderBottomRightRadius: 0,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
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