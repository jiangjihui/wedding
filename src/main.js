import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import 'vant/lib/index.css';
import { 
  Button,
  Form,
  Field,
  NavBar,
  Card,
  Tag,
  Empty,
  SwipeCell,
  Uploader,
  Overlay,
  Loading,
  Toast,
  RadioGroup,
  Radio,
  Tab,
  Tabs,
  Cell,
  CellGroup,
  Icon,
  Sidebar,
  SidebarItem,
  Dialog
} from 'vant';

const app = createApp(App);

// 注册 Vant 组件
const vantComponents = [
  Button,
  Form,
  Field,
  NavBar,
  Card,
  Tag,
  Empty,
  SwipeCell,
  Uploader,
  Overlay,
  Loading,
  Toast,
  RadioGroup,
  Radio,
  Tab,
  Tabs,
  Cell,
  CellGroup,
  Icon,
  Sidebar,
  SidebarItem,
  Dialog
];

vantComponents.forEach(component => {
  app.use(component);
});

app.use(createPinia());
app.use(router);

app.mount('#app'); 