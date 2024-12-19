import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import AdminLayout from '../components/AdminLayout.vue';
import PhotoManagement from '../views/admin/PhotoManagement.vue';
import GuestManagement from '../views/admin/GuestManagement.vue';
import LikeStatistics from '../views/admin/LikeStatistics.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/photos',
    children: [
      {
        path: 'photos',
        name: 'PhotoManagement',
        component: PhotoManagement
      },
      {
        path: 'guests',
        name: 'GuestManagement',
        component: GuestManagement
      },
      {
        path: 'likes',
        name: 'LikeStatistics',
        component: LikeStatistics
      }
    ]
  }
];

export default createRouter({
  history: createWebHistory(),
  routes
}); 