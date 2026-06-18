export type Identity = {
  id: string;
  name: string;
};

export type NightStatus = 'active' | 'revealed';

export type Member = {
  id: string;
  name: string;
  /** True for the device owner. Other members are simulated in this local prototype. */
  isYou?: boolean;
};

export type Night = {
  id: string;
  name: string;
  /** Short human-typeable invite code, e.g. "GLOW-4827". */
  code: string;
  createdAt: number;
  /** Epoch ms when photos unlock for everyone. */
  revealAt: number;
  status: NightStatus;
  members: Member[];
  /** Number of photos captured (denormalised for fast list rendering). */
  photoCount: number;
  /** Chosen cover photo for the Library card; falls back to the first photo. */
  coverPhotoId?: string;
};

export type Photo = {
  id: string;
  nightId: string;
  /** Local file uri (native) or data uri (web). */
  uri: string;
  takenAt: number;
  takenById: string;
  takenByName: string;
  /** Flagged by someone who appears in it; hidden from the reveal. */
  flagged: boolean;
};
