import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../Screens/HomeStack/Home';
import {
  Box,
  Flex,
  HStack,
  Icon,
  Input,
  Menu,
  Pressable,
  Text,
  useToast,
} from 'native-base';
import { darktheme } from '../../Theme/globalTheme';
import { SimpleLineIcons, AntDesign } from '@expo/vector-icons';
import ContactScreen from '../Screens/HomeStack/ContactScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSettingsStore from '../../Store/settingsStore';
import { Animated, Dimensions } from 'react-native';
import { supabase } from '../../Supabase/supabaseClient';
import ChatConversationScreen from '../Screens/HomeStack/ChatConversationScreen';
import ChatConversationHeader from '../Screens/HomeStack/ChatConversationHeader';
import ParametersScreen from '../Screens/HomeStack/ParametersScreen';
import { useNavigation } from '@react-navigation/core';
import ProfileParametersScreen from '../Screens/HomeStack/ProfileParametersScreen';
import ProfileUserScreen from '../Screens/HomeStack/ProfileUserScreen';
import { Profile } from '../../Interface/Types';
import HomeHeader from '../../Components/HomeScreen/HomeHeader';

type HomeStackParamList = {
  Home: undefined;
  Contacts: undefined;
  ChatConversation: {
    room_id: number | undefined;
  };
  Parameters: undefined;
  ProfileParams: undefined;
  DiscussionsParams: undefined;
  ProfileUser: {
    profile: Profile;
    room_id: number;
  };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackScreens = () => {
  const toggleContactResearch = useSettingsStore(
    (state) => state.toggleContactResearch
  );
  const isContactResearchActive = useSettingsStore(
    (state) => state.isContactResearchActive
  );
  const setProfiles = useSettingsStore((state) => state.setProfiles);
  const toast = useToast();
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('screen').width;
  const xStart = isContactResearchActive ? 0 : windowWidth + 10;
  const xEnd = !isContactResearchActive ? windowWidth + 10 : 0;
  const opacityStart = isContactResearchActive ? 1 : 0;
  const opacityEnd = !isContactResearchActive ? 0 : 1;
  const x = useRef(new Animated.Value(xStart)).current;
  const opacity = useRef(new Animated.Value(opacityStart)).current;

  useEffect(() => {
    Animated.stagger(1000, [
      Animated.timing(x, { toValue: xEnd, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: opacityEnd, useNativeDriver: false }),
    ]).start();
  }, [isContactResearchActive]);

  const handleInputText = async (textValue: string) => {
    const searchText = textValue;
    if (searchText === '') {
      setProfiles([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchText}%`);
      if (error) throw error.message;
      setProfiles(data!);
    } catch (error: any) {
      toast.show({
        description: error,
        colorScheme: 'danger',
      });
    }
  };

  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name='Home'
        component={Home}
        options={{
          title: 'ChatMore',
          headerStyle: {
            backgroundColor: darktheme.headerMenuColor,
          },
          header: (props) => <HomeHeader {...props} />,
        }}
      />

      <HomeStack.Screen
        name='Parameters'
        component={ParametersScreen}
        options={{
          title: 'Parameters',
          headerStyle: {
            backgroundColor: darktheme.headerMenuColor,
          },
          headerTintColor: 'white',
          headerBackTitle: '',
        }}
      />

      <HomeStack.Screen
        name='ProfileParams'
        component={ProfileParametersScreen}
        options={{
          title: 'Profile',
          headerStyle: {
            backgroundColor: darktheme.headerMenuColor,
          },
          headerTintColor: 'white',
          headerBackTitle: '',
        }}
      />

      <HomeStack.Screen
        name='Contacts'
        component={ContactScreen}
        options={{
          headerStyle: {
            backgroundColor: darktheme.headerMenuColor,
          },
          header: (props) => {
            return (
              <Box
                bg={darktheme.headerMenuColor}
                paddingTop={insets.top - 12}
                paddingBottom={3}
                paddingX={5}
              >
                <Flex
                  justifyContent={'space-between'}
                  alignItems='center'
                  flexDir='row'
                  position='relative'
                  overflow='hidden'
                >
                  <HStack space={8} alignItems='center'>
                    <Pressable onPress={props.navigation.goBack}>
                      <Icon
                        as={AntDesign}
                        name='arrowleft'
                        color='white'
                        size={6}
                      />
                    </Pressable>
                    <Text color='white' fontSize='xl' fontWeight='bold'>
                      {props.route.name}
                    </Text>
                  </HStack>

                  <HStack space='4' alignItems='center'>
                    <Pressable
                      onPress={toggleContactResearch}
                      _pressed={{
                        bg: darktheme.lineBreakColor,
                      }}
                      borderRadius={'full'}
                      p='1.5'
                    >
                      <Icon
                        as={AntDesign}
                        name='search1'
                        color={darktheme.textColor}
                      />
                    </Pressable>
                  </HStack>

                  <Animated.View
                    style={{
                      transform: [{ translateX: x }],
                      top: 0,
                      position: 'absolute',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <Flex
                      bg={darktheme.headerMenuColor}
                      height='full'
                      width='full'
                      alignItems={'center'}
                    >
                      <Animated.View
                        style={{
                          opacity: opacity,
                          height: '100%',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Input
                          InputLeftElement={
                            <Pressable
                              onPress={() => {
                                toggleContactResearch();
                              }}
                              zIndex={10}
                            >
                              <Icon
                                as={AntDesign}
                                name='arrowleft'
                                color='gray.500'
                                size={6}
                              />
                            </Pressable>
                          }
                          color='white'
                          placeholder='Search a user to chat with...'
                          variant='unstyled'
                          focusOutlineColor={'white'}
                          size='lg'
                          onChangeText={handleInputText}
                        />
                      </Animated.View>
                    </Flex>
                  </Animated.View>
                </Flex>
              </Box>
            );
          },
          headerTintColor: 'white',
        }}
      />

      <HomeStack.Screen
        name='ChatConversation'
        component={ChatConversationScreen}
        options={{
          headerStyle: {
            backgroundColor: darktheme.headerMenuColor,
          },
          header: (props) => <ChatConversationHeader />,
        }}
      />

      <HomeStack.Screen
        name='ProfileUser'
        component={ProfileUserScreen}
        options={{
          title: '',
          headerStyle: {
            backgroundColor: darktheme.profileColor,
          },
          headerTintColor: 'white',
          headerShadowVisible: false,
        }}
      />
    </HomeStack.Navigator>
  );
};

export default HomeStackScreens;
