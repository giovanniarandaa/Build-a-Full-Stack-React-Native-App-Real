import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  ImageGravity,
  Query,
  Storage,
} from "react-native-appwrite";
import { UserInterface, VideoInterface } from "./types";
import { DocumentPickerAsset } from "expo-document-picker";
import { ImagePickerAsset } from "expo-image-picker";

export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.jsm.aora",
  projectId: "6711ce0f0034281762d0",
  databaseId: "6711cf1a00243a740721",
  userCollectionId: "6711cf2d000e80a05101",
  videoCollectionId: "6711cf4800064a65d8a2",
  storageId: "6711d0850031ecf03439",
};

const client = new Client();

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) {
      throw new Error("Failed to create user");
    }

    const avatarURL = await avatars.getInitials(username);
    await signIn(email, password);

    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarURL,
      }
    );

    return newUser;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) {
      throw new Error("User not found");
    }

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) {
      throw new Error("User not found");
    }

    return currentUser.documents[0] as UserInterface;
  } catch (error) {
    throw error;
  }
};

export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId
    );
    return posts.documents as VideoInterface[];
  } catch (error) {
    throw error;
  }
};

export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );
    return posts.documents as VideoInterface[];
  } catch (error) {
    throw error;
  }
};

export const searchPosts = async (query: string) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.search('title', query)]
    );
    return posts.documents as VideoInterface[];
  } catch (error) {
    throw error;
  }
};

export const getUserPosts = async (userId: string) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.equal('creator', userId), Query.orderDesc("$createdAt")]
    );
    return posts.documents as VideoInterface[];
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    const session = await account.deleteSession("current");

    return session
  } catch (error) {
    throw error;
  }
}

export const getFilePreview = async (
  fileId: string,
  type: "image" | "video"
) => {
  let fileURL;

  try {
    if (type === "video") {
      fileURL = storage.getFileView(config.storageId, fileId);
    } else if (type === "image") {
      fileURL = storage.getFilePreview(
        config.storageId,
        fileId,
        2000,
        2000,
        ImageGravity.Top,
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileURL) {
      throw new Error("Failed to get file preview");
    }

    return fileURL;
  } catch (error) {
    throw error;
  }
};

export const uploadFile = async (
  file: ImagePickerAsset,
  type: "image" | "video"
) => {
  if (!file) return;

  try {
    const uploadedFile = await storage.createFile(
      config.storageId,
      ID.unique(),
      {
        name: file.fileName as string,
        size: Number(file.fileSize),
        type: file.mimeType || "",
        uri: file.uri,
      }
    );

    const fileURL = await getFilePreview(uploadedFile.$id, type);

    return fileURL;
  } catch (error) {
    throw error;
  }
};

export const createVideo = async (form: {
  title: string;
  prompt: string;
  thumbnail: ImagePickerAsset;
  video: ImagePickerAsset;
  userId: string;
}) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      config.databaseId,
      config.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        prompt: form.prompt,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw error;
  }
};
