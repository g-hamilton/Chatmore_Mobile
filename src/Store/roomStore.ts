import create from 'zustand';
import { SessionState } from '../Interface/StoreState';
import { immer } from 'zustand/middleware/immer';
import { Session, User } from '@supabase/supabase-js';
import {
  Image,
  Message,
  Profile,
  Room,
  UserHasBlockedRoom,
} from '../Interface/Types';
import {
  getUserRooms,
  getRoomWithUserProfile,
  getRoomMessages,
  getRoomBlockUsers,
} from '../Api/API';
import useAuthStore from './authStore';
export interface RoomState {
  room: number;
  users: Profile[];
  messages: DateMessages[];
  index?: number;
  blockedUsers: UserHasBlockedRoom[];
}

type State = {
  rooms: RoomState[];
  isLoading: boolean;
};

interface RoomsState {
  rooms: RoomState[];
}

interface RoomInnerJoinData {
  id: number;
  room_id: number;
  user_id: string;
  profiles: Profile;
}

export interface DateMessages {
  id: number;
  date: string;
  messages: Message[];
}

type Actions = {
  getChatrooms: (user: User) => void;
  addRoom: (room: RoomState) => void;
  addMessageToRoom: (message: Message | undefined) => void;
  removeMessageFromRoom: (message: Message | undefined) => void;
  emptyRooms: () => void;
  updateViewRoomMessages: (
    messages: Message[],
    connectedUserId: string | undefined
  ) => void;
  deleteBlockedUser: (roomId: number, profileId: string | undefined) => void;
  addBlockedUser: (blockUser: UserHasBlockedRoom) => void;
};

const initialState: State = {
  rooms: [],
  isLoading: true,
};

const getDatesFromMessages = (messages: Message[]) => {
  const dates = messages.map((room: Message) =>
    new Date(room.created_at).toDateString()
  );
  return [...new Set(dates)];
};

const formatMessagesByDates = (messages: Message[]) => {
  const dates = getDatesFromMessages(messages);
  let dateMessages: DateMessages[] = [];
  if (!dates) return dateMessages;
  dates.forEach((date, index) => {
    const messagesWithDates = messages.filter(
      (message) => new Date(message.created_at).toDateString() === date
    );
    if (date) {
      dateMessages = [
        ...dateMessages,
        { id: index, date: date, messages: messagesWithDates },
      ];
    }
  });
  return dateMessages;
};

const getUserChatRooms = async (user: User) => {
  const userRooms = await getUserRooms(user?.id!);
  console.log('userRooms', userRooms);

  let newRooms: RoomsState = {
    rooms: [],
  };

  for (let i = 0; i < userRooms?.length || 0; i++) {
    const roomData: any = await getRoomWithUserProfile(userRooms[i].room_id);
    console.log('roomData', roomData);
    const roomMessages: any = await getRoomMessages(userRooms[i].room_id);
    console.log('roomMessages', roomMessages);
    const roomBlockUsers: any = await getRoomBlockUsers(userRooms[i].room_id);
    const newRoom: RoomState = {
      room: 0,
      users: [],
      messages: [],
      blockedUsers: [],
      index: i,
    };
    if (!roomData || !roomMessages) return newRooms;
    roomData.forEach((room: RoomInnerJoinData) => {
      newRoom.room = room.room_id;
      if (room.user_id !== user.id) newRoom.users.push(room.profiles);
    });

    newRoom.messages = formatMessagesByDates(roomMessages.reverse());
    newRoom.blockedUsers = roomBlockUsers;
    console.log('newRoom', newRoom);
    newRooms.rooms.push(newRoom);
  }

  return newRooms;
};

const useRoomStore = create(
  immer<State & Actions>((set) => ({
    ...initialState,
    getChatrooms: async (user) => {
      const rooms = await getUserChatRooms(user);
      set((state) => {
        state.rooms = rooms.rooms;
        state.isLoading = false;
      });
    },
    addRoom: (room) =>
      set((state) => {
        state.rooms.push(room);
      }),
    addMessageToRoom: (message) =>
      set((state) => {
        if (message !== undefined) {
          const roomIndex = state.rooms.findIndex(
            (room) => room.room === message.room_id
          );
          if (roomIndex !== -1) {
            const dateIndex = state.rooms[roomIndex].messages.findIndex(
              (dateMessage) =>
                new Date(message.created_at).toDateString() === dateMessage.date
            );
            // Date Index -1
            if (dateIndex === -1) {
              const dateMessage: DateMessages = {
                id: state.rooms[roomIndex]?.messages?.length,
                date: new Date(message.created_at).toDateString(),
                messages: [message],
              };
              state.rooms[roomIndex].messages = [
                dateMessage,
                ...state.rooms[roomIndex].messages,
              ];
            } else {
              state.rooms[roomIndex].messages[dateIndex].messages = [
                message,
                ...state.rooms[roomIndex].messages[dateIndex].messages,
              ];
            }
          }
        }
      }),
    removeMessageFromRoom: (message) =>
      set((state) => {
        if (message !== undefined) {
          const roomIndex = state.rooms.findIndex(
            (room) => room.room === message.room_id
          );
          if (roomIndex !== -1) {
            const dateIndex = state.rooms[roomIndex].messages.findIndex(
              (dateMessage) =>
                new Date(message.created_at).toDateString() === dateMessage.date
            );
            state.rooms[roomIndex].messages[dateIndex].messages = state.rooms[
              roomIndex
            ].messages[dateIndex].messages.filter(
              (mess) => mess.id !== message.id
            );
          }
        }
      }),
    updateViewRoomMessages: (messages) => {
      set((state) => {
        const roomIndex = state.rooms.findIndex(
          (room) => room.room === messages[0].room_id
        );
        if (roomIndex !== -1) {
          const room = { ...state.rooms[roomIndex] };
          for (let index = 0; index < messages?.length; index++) {
            const message = messages[index];
            const dateIndex = room.messages.findIndex(
              (dateMessage) =>
                new Date(message.created_at).toDateString() === dateMessage.date
            );

            room.messages[dateIndex].messages = room.messages[
              dateIndex
            ].messages.map((mess) => {
              if (mess.id === message.id) {
                return { ...mess, ...message };
              }
              return mess;
            });
          }
          state.rooms[roomIndex].messages = room.messages;
        }
      });
    },
    emptyRooms: () =>
      set((state) => {
        state.rooms = initialState.rooms;
        state.isLoading = initialState.isLoading;
      }),
    deleteBlockedUser: (roomId, profileId) =>
      set((state) => {
        const roomIndex = state.rooms.findIndex((room) => room.room === roomId);
        if (roomIndex !== -1) {
          const room = { ...state.rooms[roomIndex] };
          const updateBlockedUsers = room.blockedUsers.filter(
            (userRoom) =>
              userRoom.blocking_user_id !== profileId &&
              userRoom.room_id !== roomId
          );
          state.rooms[roomIndex].blockedUsers = updateBlockedUsers;
        }
      }),
    addBlockedUser: (blockUser) =>
      set((state) => {
        const roomIndex = state.rooms.findIndex(
          (room) => room.room === blockUser.room_id
        );
        if (roomIndex !== -1) {
          state.rooms[roomIndex].blockedUsers.push(blockUser);
        }
      }),
  }))
);

export default useRoomStore;
