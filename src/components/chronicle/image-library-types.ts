export type ImageFolder = {
  id: string;
  userId: string;
  name: string;
  description: string;
  thumbnailImageId: string | null;
  thumbnailUrl: string | null;
  thumbnailPath?: string | null;
  imageCount: number;
  createdAt: number;
  updatedAt: number;
};

export type LibraryImage = {
  id: string;
  userId: string;
  folderId: string;
  imageUrl: string;
  imagePath?: string | null;
  filename: string;
  title: string;
  isThumbnail: boolean;
  tags: string[];
  createdAt: number;
};
