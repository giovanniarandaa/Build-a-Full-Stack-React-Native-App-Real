import { Models } from "react-native-appwrite";

export interface VideoInterface extends Models.Document {
  title: string;
  thumbnail: string;
  prompt: string;
  video: string;
  creator: UserInterface
}

export interface UserInterface extends Models.Document {
  username: string;
  email: string;
  avatar: string;
  accountId: string;
}