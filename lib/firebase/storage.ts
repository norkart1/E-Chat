import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./config";
import { v4 as uuidv4 } from "uuid";

export async function uploadFile(
  file: File,
  chatId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; name: string; type: string }> {
  const ext = file.name.split(".").pop();
  const path = `chats/${chatId}/${uuidv4()}.${ext}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, name: file.name, type: file.type });
      }
    );
  });
}
