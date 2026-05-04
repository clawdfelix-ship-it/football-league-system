export type PublicPlayer = {
  id: number;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  team: string | null;
  photoUrl: string | null;
  status: string | null;
};

export type PublicAnnouncement = {
  id: number;
  title: string | null;
  content: string;
  date: string;
  createdAt: string | null;
  updatedAt: string | null;
};
