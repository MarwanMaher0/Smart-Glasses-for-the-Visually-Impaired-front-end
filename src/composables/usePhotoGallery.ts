import { ref, onMounted, watch } from 'vue'
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'
import { isPlatform } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import axios from 'axios'

export interface UserPhoto {
  filepath: string
  webviewPath?: string;
  blob: Blob;

}

const PHOTO_STORAGE = 'photos'


const convertBlobToBase64 = async (blob: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.readAsDataURL(blob)
  })

 


export const usePhotoGallery = () => {
  const photos = ref<UserPhoto[]>([])

  const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
    let base64Data: string
    let blob: Blob | undefined

    if (isPlatform('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!
      })
      base64Data = file.data as string
      blob = new Blob([atob(base64Data)], { type: 'image/jpeg' })  // Convert base64Data to a Blob
    } else {
      const response = await fetch(photo.webPath!)
      blob = await response.blob()
      base64Data = (await convertBlobToBase64(blob)) as string
    }

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    })

    return {
      filepath: isPlatform('hybrid') ? savedFile.uri : fileName,
      webviewPath: isPlatform('hybrid') ? Capacitor.convertFileSrc(savedFile.uri) : photo.webPath,
      blob: blob,  // Return the blob
    }
  }
  const postImage = async (photo: UserPhoto) => {
    try {
      const formData = new FormData()
      formData.append('image', photo.blob, `${Date.now()}.png`)  // Append the blob property of the photo
      const response = await axios.post('http://127.0.0.1:8000/app/pass-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('Image uploaded successfully:', response.data)
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
  
const takePhoto = async () => {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 100
  })

  const fileName = Date.now() + '.jpeg'
  
  const savedFileImage = await savePicture(photo, fileName)
    
  const userPhoto: UserPhoto = {
    filepath: savedFileImage.filepath,
    webviewPath: savedFileImage.webviewPath,
    blob: savedFileImage.blob
  }
    
  photos.value = [userPhoto, ...photos.value]
  postImage(userPhoto)  // Here you are posting the image after saving it
}

  const cachePhotos = () => {
    Preferences.set({
      key: PHOTO_STORAGE,
      value: JSON.stringify(photos.value)
    })
  }

  const loadSaved = async () => {
    const photoList = await Preferences.get({ key: PHOTO_STORAGE })
    const photosInPreferences = photoList.value ? JSON.parse(photoList.value) : []

    // If running on the web...
    if (!isPlatform('hybrid')) {
      for (const photo of photosInPreferences) {
        const file = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        })
        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${file.data}`
      }
    }

    photos.value = photosInPreferences
  }

  const deletePhoto = async (photo: UserPhoto) => {
    // Remove this photo from the Photos reference data array
    photos.value = photos.value.filter((p) => p.filepath !== photo.filepath)
  
    // delete photo file from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1)
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    })
  }
 

  onMounted(loadSaved)
  watch(photos, cachePhotos)

  return {
    photos,
    takePhoto,
    deletePhoto,
    postImage
  }
}
