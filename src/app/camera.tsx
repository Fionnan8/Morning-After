import { useLocalSearchParams, useRouter } from 'expo-router';

import { CameraCapture } from '@/components/camera-capture';

export default function CameraScreen() {
  const { nightId } = useLocalSearchParams<{ nightId: string }>();
  const router = useRouter();
  return <CameraCapture nightId={nightId} isActive onClose={() => router.back()} />;
}
