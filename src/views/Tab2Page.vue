<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Photo Gallery</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-grid>
        <ion-row>
          <ion-col size="6" :key="photo.filepath" @click="showActionSheet(photo)" v-for="photo in photos">
            <ion-img :src="photo.webviewPath"></ion-img>
          </ion-col>
        </ion-row>
      </ion-grid>
      <ion-fab vertical="bottom" horizontal="center" slot="fixed">
        <ion-fab-button @click="takePhoto()">
          <ion-icon :icon="camera"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
  <div v-if="audios">
    <audio controls>
      <source :src="audios" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>
</template>


<script setup lang="ts">
import { camera, trash, send } from 'ionicons/icons';
import {
  actionSheetController,
  IonPage,
  IonHeader,
  IonFab,
  IonFabButton,
  IonIcon,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
} from '@ionic/vue';
import { usePhotoGallery, UserPhoto } from '@/composables/usePhotoGallery';
import axios from 'axios';
import { ref } from 'vue';

const { photos, takePhoto, deletePhoto } = usePhotoGallery();

const showActionSheet = async (photo: UserPhoto) => {
  const actionSheet = await actionSheetController.create({
    header: 'Photos',
    buttons: [
      {
        text: 'Delete',
        role: 'destructive',
        icon: trash,
        handler: () => {
          deletePhoto(photo);
        },
      },
      {
        text: 'Send',
        icon: send,
        role: 'send',
        handler: () => {
          postImage(photo);
        },
      },
    ],
  });
  await actionSheet.present();
};

const audios = ref(''); // Ref to store audio file path

const postImage = async (photo: UserPhoto) => {
  try {
    const formData = new FormData();
    formData.append('image', photo.blob, `${Date.now()}.png`); // Append the blob property of the photo
    const response = await axios.post('http://127.0.0.1:8000/app/pass-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Response from server:', response.data); // Debugging log
    audios.value = response.data.audio_file ? `http://127.0.0.1:8000${response.data.audio_file}` : ''; // Update audios ref with the audio file path from the response
    console.log('Updated audio path:', audios.value); // Debugging log
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};


</script>
