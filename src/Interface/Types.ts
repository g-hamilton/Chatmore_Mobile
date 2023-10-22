import { Database } from '../../DatabaseDefinitions';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Image = Database['public']['Tables']['images']['Row'];
export type Message = Database['public']['Tables']['message']['Row'] & {
  images?: Image[];
};
export type Room = Database['public']['Tables']['room']['Row'];
export type UserHasRoom = Database['public']['Tables']['user_has_room']['Row'];
export type UserHasBlockedRoom =
  Database['public']['Tables']['user_has_blocked_room']['Row'];
